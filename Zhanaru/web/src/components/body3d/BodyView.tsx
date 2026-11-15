// Модель тела: детальная фигура (женская или мужская) с подсветкой зон и подписями.
// Зоны окрашиваются поверх картинки в режиме смешивания «цвет»: анатомия остаётся видна,
// а оттенок меняется от янтарного («сейчас») к зелёному («цель программы»).
// Прежний 3D-манекен (BodyCanvas.tsx, BodySvg.tsx) оставлен в проекте на случай лицензионной GLB-модели,
// но на страницу не подключён.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { getFigure } from './figure';
import Hotspots, { type Hotspot, type Rect } from './Hotspots';
import { zoneColor, type BodySex, type ZoneId, type ZoneValues } from './model';

interface Props {
  sex?: BodySex;
  values?: ZoneValues;
  pulse?: ZoneId | null;
  hotspots?: Hotspot[];
  /** На экране результата фигура стоит ровно, чтобы подписи совпадали с зонами. */
  sway?: boolean;
  label: string;
  className?: string;
  /** ИМТ: фигура становится чуть шире или уже — посетитель видит отклик на ползунок веса. */
  build?: number | null;
  /** Слой поверх модели: индекс и рекомендация на экране результата. */
  children?: ReactNode;
  /** Место сверху и снизу под карточки слоя children, px: фигура вписывается между ними. */
  reserve?: { top: number; bottom: number };
}

/** Ширина фигуры относительно исходной картинки при заданном ИМТ. */
const buildScale = (b?: number | null) => (b ? Math.min(1.22, Math.max(0.9, 1 + (b - 22) * 0.014)) : 1);

const ZONES = ['head', 'thyroid', 'chest', 'liver', 'abdomen', 'pelvis'] as const;

export default function BodyView({
  sex = 'n', values = {}, pulse = null, hotspots, sway = false, label, className = '', build, children,
  reserve = { top: 0, bottom: 0 },
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [focused, setFocused] = useState<ZoneId | null>(null);
  const [loaded, setLoaded] = useState('');
  const figure = getFigure(sex);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(el);
    // обе фигуры загружаем заранее, чтобы при выборе пола картинка сменилась без пустого кадра
    const big = el.clientHeight * devicePixelRatio > 760;
    for (const s of ['f', 'm'] as const) new Image().src = big ? getFigure(s).src : getFigure(s).srcSmall;
    return () => ro.disconnect();
  }, []);

  // фигура вписана в контейнер с отступом под свечение
  const ratio = figure.width / figure.height;
  const spaceH = Math.max(0, size.height - reserve.top - reserve.bottom);
  const fw = Math.min(size.width * 0.9, spaceH * 0.94 * ratio);
  const fh = fw / ratio;
  const wide = Math.min(size.width * 0.96, fw * buildScale(build));
  const rect: Rect = {
    width: wide,
    height: fh,
    left: (size.width - wide) / 2,
    top: reserve.top + (spaceH - fh) / 2,
  };

  const activePulse = focused ?? pulse;
  // маска зон — та же картинка, что выбрал браузер по srcset: без второго скачивания
  const maskSrc = loaded.startsWith(figure.src.replace('.webp', '')) ? loaded : figure.srcSmall;
  const mask: CSSProperties = {
    maskImage: `url(${maskSrc})`,
    WebkitMaskImage: `url(${maskSrc})`,
    maskSize: '100% 100%',
    WebkitMaskSize: '100% 100%',
  };
  const still = sway || !!hotspots;

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      data-body-mode="image"
      data-body-sex={sex === 'm' ? 'm' : 'f'}
      className={`body-view relative ${className}`}
      style={{ touchAction: 'pan-y' }}
      // движение указателя слегка поворачивает фигуру; вертикальный жест остаётся скроллом
      onPointerMove={(e) => {
        if (still || !tilt.current) return;
        const box = e.currentTarget.getBoundingClientRect();
        const k = (e.clientX - box.left) / box.width - 0.5;
        tilt.current.style.animation = 'none';
        tilt.current.style.transform = `rotateY(${(k * 26).toFixed(1)}deg)`;
      }}
      onPointerLeave={() => {
        if (!tilt.current) return;
        tilt.current.style.animation = '';
        tilt.current.style.transform = '';
      }}
    >
      <div className="body-glow" aria-hidden="true" />
      {size.width > 0 && (
        <div className="body-frame absolute [perspective:900px]" style={rect}>
          <div ref={tilt} className={`relative h-full w-full ${still ? '' : 'body-sway'}`}>
            <img
              src={figure.srcSmall}
              srcSet={`${figure.srcSmall} ${figure.width / 2}w, ${figure.src} ${figure.width}w`}
              sizes={`${Math.round(rect.width)}px`}
              onLoad={(e) => setLoaded(new URL(e.currentTarget.currentSrc).pathname)}
              alt=""
              width={figure.width}
              height={figure.height}
              draggable={false}
              className="h-full w-full select-none"
            />
            {/* подсветка зон: только по силуэту фигуры */}
            <div className="absolute inset-0" style={{ ...mask, mixBlendMode: 'color' }}>
              <span
                className="absolute inset-0 transition-[opacity,background-color] duration-500"
                style={{
                  backgroundColor: zoneColor(values.skin ?? 60),
                  opacity: values.skin !== undefined ? 0.9 : activePulse === 'skin' ? 0.5 : 0,
                }}
              />
              {ZONES.map((zone) => {
                const z = figure.zones[zone];
                const v = values[zone];
                const on = v !== undefined || activePulse === zone;
                const color = zoneColor(v ?? 50);
                return (
                  <span
                    key={zone}
                    data-zone={zone}
                    data-zone-on={on}
                    className="absolute transition-opacity duration-500"
                    style={{
                      left: `${(z.x - z.rx) * 100}%`,
                      top: `${(z.y - z.ry) * 100}%`,
                      width: `${z.rx * 200}%`,
                      height: `${z.ry * 200}%`,
                      background: `radial-gradient(closest-side, ${color} 62%, transparent)`,
                      opacity: on ? 1 : 0,
                    }}
                  />
                );
              })}
            </div>
            {/* мягкое свечение подсвеченных зон и «сканирующий» блик */}
            <div className="absolute inset-0 overflow-hidden" style={mask} aria-hidden="true">
              {ZONES.map((zone) => {
                const z = figure.zones[zone];
                const v = values[zone];
                return (
                  <span
                    key={zone}
                    className="absolute transition-opacity duration-500"
                    style={{
                      left: `${(z.x - z.rx) * 100}%`,
                      top: `${(z.y - z.ry) * 100}%`,
                      width: `${z.rx * 200}%`,
                      height: `${z.ry * 200}%`,
                      background: `radial-gradient(closest-side, ${zoneColor(v ?? 50)}, transparent)`,
                      mixBlendMode: 'screen',
                      opacity: v !== undefined ? 0.35 : 0,
                    }}
                  />
                );
              })}
              <span className="body-scan" />
            </div>
            {activePulse && activePulse !== 'skin' && (
              <span
                className="zone-ping absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ left: `${figure.zones[activePulse].x * 100}%`, top: `${figure.zones[activePulse].y * 100}%` }}
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      )}
      {hotspots && size.width > 0 && (
        <Hotspots
          items={hotspots}
          figure={figure}
          rect={rect}
          containerWidth={size.width}
          containerHeight={size.height}
          onFocus={setFocused}
          band={reserve}
        />
      )}
      {children}
    </div>
  );
}
