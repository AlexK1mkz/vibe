// Детальная фигура человека (public/img/body-f.webp, body-m.webp) и разметка зон на ней.
// Координаты — доли от размеров картинки: x слева, y сверху. Картинки готовит scripts/make-figures.mjs.
import type { BodySex, ZoneId } from './model';

interface Spot { x: number; y: number; rx: number; ry: number }

export interface Figure {
  src: string;
  /** Та же картинка вдвое меньше — для телефона и узкой колонки. */
  srcSmall: string;
  width: number;
  height: number;
  /** Пятна подсветки зон. Зона «кожа» — вся поверхность, отдельного пятна у неё нет. */
  zones: Record<Exclude<ZoneId, 'skin'>, Spot>;
  /** Точка привязки подписи для зоны «кожа». */
  skinAnchor: { x: number; y: number };
}

const female: Figure = {
  src: '/img/body-f.webp',
  srcSmall: '/img/body-f-700.webp',
  width: 488,
  height: 1400,
  zones: {
    head: { x: 0.42, y: 0.072, rx: 0.26, ry: 0.087 },
    thyroid: { x: 0.44, y: 0.143, rx: 0.13, ry: 0.031 },
    chest: { x: 0.47, y: 0.251, rx: 0.36, ry: 0.087 },
    liver: { x: 0.41, y: 0.343, rx: 0.17, ry: 0.041 },
    abdomen: { x: 0.46, y: 0.395, rx: 0.3, ry: 0.067 },
    pelvis: { x: 0.47, y: 0.482, rx: 0.34, ry: 0.061 },
  },
  skinAnchor: { x: 0.33, y: 0.646 },
};

const male: Figure = {
  src: '/img/body-m.webp',
  srcSmall: '/img/body-m-700.webp',
  width: 518,
  height: 1400,
  zones: {
    head: { x: 0.47, y: 0.072, rx: 0.24, ry: 0.087 },
    thyroid: { x: 0.49, y: 0.149, rx: 0.12, ry: 0.031 },
    chest: { x: 0.49, y: 0.256, rx: 0.38, ry: 0.087 },
    liver: { x: 0.42, y: 0.343, rx: 0.18, ry: 0.041 },
    abdomen: { x: 0.49, y: 0.405, rx: 0.3, ry: 0.067 },
    pelvis: { x: 0.49, y: 0.487, rx: 0.32, ry: 0.056 },
  },
  skinAnchor: { x: 0.36, y: 0.656 },
};

/** Пока пол не выбран, показываем женскую фигуру: это основная аудитория клиники. */
export const getFigure = (sex: BodySex): Figure => (sex === 'm' ? male : female);

export const zoneAnchor = (figure: Figure, zone: ZoneId) =>
  zone === 'skin' ? figure.skinAnchor : { x: figure.zones[zone].x, y: figure.zones[zone].y };
