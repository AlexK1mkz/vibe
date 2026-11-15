import type { APIRoute } from 'astro';

// Clean-param — для Яндекса: ссылки с метками рекламы считаются одной страницей, а не дублями.
const params = 'utm_source&utm_medium&utm_campaign&utm_content&utm_term&gclid&fbclid&yclid&ysclid';

export const GET: APIRoute = ({ site }) =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      'Disallow: /thanks/',
      '',
      'User-agent: Yandex',
      'Allow: /',
      'Disallow: /api/',
      'Disallow: /thanks/',
      `Clean-param: ${params} /`,
      '',
      `Sitemap: ${new URL('sitemap-index.xml', site).href}`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
