import { NextResponse, type NextRequest } from "next/server";
import { CLIENT_ONLY, clientUrl, currentSite, specialistsUrl } from "@/lib/site";

/**
 * Разводит два сайта по доменам. Страницы другого сайта на этом домене недоступны:
 * редирект на нужный домен, а если его адрес не задан, то 404.
 */
export function proxy(request: NextRequest) {
  const site = currentSite();
  if (site === "all") return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const notFound = () => NextResponse.rewrite(new URL("/__site-not-found", request.url));
  const isSpecialists = pathname === "/specialists" || pathname.startsWith("/specialists/");
  const isClientOnly = CLIENT_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (site === "specialists") {
    if (pathname === "/") return NextResponse.rewrite(new URL(`/specialists${search}`, request.url));
    if (isSpecialists) return NextResponse.redirect(new URL(`/${search}`, request.url));
    if (isClientOnly) {
      return clientUrl() ? NextResponse.redirect(`${clientUrl()}${pathname}${search}`) : notFound();
    }
  }

  if (site === "client" && isSpecialists) {
    return specialistsUrl() ? NextResponse.redirect(`${specialistsUrl()}/${search}`) : notFound();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/specialists/:path*", "/test/:path*", "/result/:path*", "/consultation/:path*", "/intensive/:path*"],
};
