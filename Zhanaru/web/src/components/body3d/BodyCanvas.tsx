// 3D-модель тела: «стеклянный» манекен с fresnel-контуром. Грузится отдельным чанком (см. BodyView).
// Когда клиника пришлёт лицензионную GLB-модель, меши манекена заменяются мешами модели
// с теми же именами зон — логика цвета (ZoneMesh) остаётся прежней.
import { Canvas, useFrame } from '@react-three/fiber';
import { createContext, useContext, useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import {
  BODY_HEIGHT, CAMERA_DISTANCE, CAMERA_FOV, COLORS, getModel, zoneColor,
  type BodySex, type Capsule, type Ellipsoid, type ZoneId, type ZoneValues,
} from './model';

const vertexShader = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uOrgan;
  uniform float uPulse;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float ndv = abs(dot(normalize(vN), normalize(vV)));
    float fres = pow(1.0 - ndv, 1.8);
    float shell = 0.2 + 0.72 * fres;          // стекло: прозрачный центр, плотный контур
    float organ = pow(ndv, 1.3) * 0.9;         // орган: плотный центр, мягкий край
    float a = mix(shell, organ, uOrgan) * uOpacity * (1.0 + 0.5 * uPulse);
    vec3 col = mix(uColor, uColor * 0.72, fres * (1.0 - uOrgan));
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`;

const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });

interface Live { values: ZoneValues; pulse: ZoneId | null; sway: boolean }
const LiveCtx = createContext<RefObject<Live>>({ current: { values: {}, pulse: null, sway: false } });

type MeshProps = {
  zone: ZoneId;
  organ?: boolean;
  geometry: THREE.BufferGeometry;
  position?: THREE.Vector3Tuple;
  quaternion?: THREE.Quaternion;
  scale?: THREE.Vector3Tuple;
};

function ZoneMesh({ zone, organ = false, geometry, position, quaternion, scale }: MeshProps) {
  const live = useContext(LiveCtx);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(COLORS.brand) },
          uOpacity: { value: organ ? 0 : 0.85 },
          uOrgan: { value: organ ? 1 : 0 },
          uPulse: { value: 0 },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: !organ, // органы светятся сквозь поверхность
      }),
    [organ],
  );
  useEffect(() => () => material.dispose(), [material]);
  const target = useMemo(() => new THREE.Color(), []);

  useFrame((state, dt) => {
    const { values, pulse } = live.current;
    // поверхность без своего значения наследует значение зоны «кожа»
    const v = values[zone] ?? (organ ? undefined : values.skin);
    const pulsing = pulse === zone;
    const u = material.uniforms;
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 5);
    target.set(v === undefined ? (organ ? COLORS.now : COLORS.brand) : zoneColor(v));
    u.uColor.value.lerp(target, k);
    const opacity = organ ? (v !== undefined || pulsing ? 1 : 0) : v !== undefined || pulsing ? 1 : 0.85;
    u.uOpacity.value += (opacity - u.uOpacity.value) * k;
    u.uPulse.value = pulsing ? 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 4.5) : 0;
  });

  const transform = { geometry, position, quaternion, scale };
  return (
    <>
      {/* проход глубины: сквозь стекло не видны стыки и задние стенки частей тела */}
      {!organ && <mesh {...transform} material={depthOnly} renderOrder={0} />}
      <mesh {...transform} material={material} renderOrder={organ ? 2 : 1} />
    </>
  );
}

const UP = new THREE.Vector3(0, 1, 0);

/** Сужающаяся капсула вдоль оси Y: нижний радиус r1, верхний r2. */
function taperedCapsule(r1: number, r2: number, len: number) {
  const pts: THREE.Vector2[] = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const ang = -Math.PI / 2 + (i / steps) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(r1 * Math.cos(ang), 0.0001), -len / 2 + r1 * Math.sin(ang)));
  }
  for (let i = 0; i <= steps; i++) {
    const ang = (i / steps) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(r2 * Math.cos(ang), 0.0001), len / 2 + r2 * Math.sin(ang)));
  }
  return new THREE.LatheGeometry(pts, 24);
}

function capsuleProps(c: Capsule) {
  const a = new THREE.Vector3(...c.a);
  const b = new THREE.Vector3(...c.b);
  const dir = b.clone().sub(a);
  const len = dir.length();
  return {
    geometry: taperedCapsule(c.r, c.r2 ?? c.r, len),
    position: a.clone().add(b).multiplyScalar(0.5).toArray() as THREE.Vector3Tuple,
    quaternion: new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize()),
  };
}

const sphere = new THREE.SphereGeometry(1, 36, 24);
const ellipsoidProps = (e: Ellipsoid) => ({ geometry: sphere, position: e.c, scale: e.r });

/** Торс — одно тело вращения, разрезанное на три зоны: нормали общие, швов не видно. */
function torsoGeometries(model: ReturnType<typeof getModel>) {
  const { pelvis, abdomen, chest } = model.torso;
  const profile = [...pelvis, ...abdomen.slice(1), ...chest.slice(1)];
  const segments = 44;
  const full = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments);
  const n = profile.length;
  const slice = (from: number, to: number) => {
    const index: number[] = [];
    for (let i = 0; i < segments; i++)
      for (let j = from; j < to; j++) {
        const a = j + i * n;
        const b = a + n;
        index.push(a, b, a + 1, b + 1, a + 1, b);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', full.getAttribute('position'));
    g.setAttribute('normal', full.getAttribute('normal'));
    g.setIndex(index);
    return g;
  };
  const p = pelvis.length - 1;
  const ab = p + abdomen.length - 1;
  return { pelvis: slice(0, p), abdomen: slice(p, ab), chest: slice(ab, n - 1) };
}

function Body({ sex }: { sex: BodySex }) {
  const parts = useMemo(() => {
    const m = getModel(sex);
    return {
      m,
      torso: torsoGeometries(m),
      limbs: m.limbs.map(capsuleProps),
      neck: capsuleProps(m.neck),
    };
  }, [sex]);
  useEffect(
    () => () => {
      Object.values(parts.torso).forEach((g) => g.dispose());
      parts.limbs.forEach((l) => l.geometry.dispose());
      parts.neck.geometry.dispose();
    },
    [parts],
  );
  const flat: THREE.Vector3Tuple = [1, 1, parts.m.depth];

  return (
    <>
      {parts.limbs.map((l, i) => <ZoneMesh key={i} zone="skin" {...l} />)}
      <ZoneMesh zone="pelvis" geometry={parts.torso.pelvis} scale={flat} />
      <ZoneMesh zone="abdomen" geometry={parts.torso.abdomen} scale={flat} />
      <ZoneMesh zone="chest" geometry={parts.torso.chest} scale={flat} />
      <ZoneMesh zone="thyroid" {...parts.neck} />
      <ZoneMesh zone="head" {...ellipsoidProps(parts.m.head)} />
      <ZoneMesh zone="liver" organ {...ellipsoidProps(parts.m.liver)} />
      <ZoneMesh zone="thyroid" organ {...ellipsoidProps(parts.m.thyroid)} />
    </>
  );
}

interface Drag { offset: number; active: boolean; releasedAt: number }

function Rig({ sex, drag }: { sex: BodySex; drag: RefObject<Drag> }) {
  const group = useRef<THREE.Group>(null);
  const live = useContext(LiveCtx);
  const auto = useRef(0);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const d = drag.current;
    const step = Math.min(dt, 0.1);
    const idle = !d.active && state.clock.elapsedTime - d.releasedAt > 2.5;
    if (live.current.sway) {
      // на экране результата модель лишь покачивается, чтобы подписи совпадали с зонами
      const target = Math.sin(state.clock.elapsedTime * 0.5) * 0.24;
      auto.current += (target - auto.current) * (1 - Math.exp(-step * 2));
      if (idle) d.offset *= Math.exp(-step * 1.5);
    } else if (idle) {
      auto.current += step * 0.32;
    }
    g.rotation.y = auto.current + d.offset;
  });

  return (
    <group ref={group} position={[0, -BODY_HEIGHT / 2, 0]}>
      <Body sex={sex} />
    </group>
  );
}

export interface BodyCanvasProps {
  sex: BodySex;
  values: ZoneValues;
  pulse: ZoneId | null;
  sway: boolean;
  running: boolean;
  onReady: () => void;
}

export default function BodyCanvas({ sex, values, pulse, sway, running, onReady }: BodyCanvasProps) {
  const live = useRef<Live>({ values, pulse, sway });
  live.current = { values, pulse, sway };
  const drag = useRef<Drag>({ offset: 0, active: false, releasedAt: -10 });
  const pointer = useRef<{ id: number; x: number } | null>(null);
  const clock = useRef<THREE.Clock | null>(null);

  return (
    <div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      // горизонтальный жест вращает модель, вертикальный остаётся скроллом страницы
      style={{ touchAction: 'pan-y' }}
      onPointerDown={(e) => {
        pointer.current = { id: e.pointerId, x: e.clientX };
        drag.current.active = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const p = pointer.current;
        if (!p || p.id !== e.pointerId) return;
        drag.current.offset += (e.clientX - p.x) * 0.011;
        p.x = e.clientX;
      }}
      onPointerUp={() => release()}
      onPointerCancel={() => release()}
    >
      <LiveCtx.Provider value={live}>
        <Canvas
          dpr={[1, 1.75]}
          frameloop={running ? 'always' : 'demand'}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          camera={{ fov: CAMERA_FOV, position: [0, 0, CAMERA_DISTANCE], near: 0.1, far: 20 }}
          onCreated={(state) => {
            clock.current = state.clock;
            onReady();
          }}
        >
          <Rig sex={sex} drag={drag} />
        </Canvas>
      </LiveCtx.Provider>
    </div>
  );

  function release() {
    pointer.current = null;
    drag.current.active = false;
    drag.current.releasedAt = clock.current?.elapsedTime ?? 0;
  }
}
