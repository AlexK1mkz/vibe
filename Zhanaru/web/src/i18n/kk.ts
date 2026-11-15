// Казахская версия: маршрут /kk/ готов, перевод подключается после утверждения текстов клиникой.
// Пока translated = false, страница /kk/ показывает русские тексты и закрыта от индексации.
// Чтобы включить перевод: переведите строки ниже и контент в src/content, затем поставьте translated: true.
import { ru, type Dict } from './ru';

export const kk: Dict = {
  ...ru,
  meta: { lang: 'kk', locale: 'kk_KZ', translated: false },
};
