/**
 * Один код, два сайта (ТЗ v2). Переменная окружения SITE решает, какой сайт открыт на домене:
 *   SITE=client       клиентский: лендинг, тест, результат, консультация, интенсив
 *   SITE=specialists  для специалистов: лендинг с анкетой на «/»
 *   не задана         все разделы доступны (локальная разработка и тесты)
 * Адреса сайтов для ссылок и редиректов между доменами: CLIENT_URL и SPECIALISTS_URL.
 */
export type Site = "client" | "specialists" | "all";

export function currentSite(): Site {
  const value = process.env.SITE;
  return value === "client" || value === "specialists" ? value : "all";
}

/** Разделы, которые есть только на клиентском сайте */
export const CLIENT_ONLY = ["/test", "/result", "/consultation", "/intensive"];

const clean = (url: string | undefined) => (url ? url.replace(/\/$/, "") : "");

export const clientUrl = () => clean(process.env.CLIENT_URL);
export const specialistsUrl = () => clean(process.env.SPECIALISTS_URL);

/** Ссылка на раздел клиентского сайта с любого из двух доменов */
export function clientHref(path = "/"): string {
  return currentSite() === "specialists" && clientUrl() ? `${clientUrl()}${path}` : path;
}

/** Ссылка на лендинг специалистов с любого из двух доменов */
export function specialistsHref(): string {
  if (currentSite() === "specialists") return "/";
  return specialistsUrl() || "/specialists";
}
