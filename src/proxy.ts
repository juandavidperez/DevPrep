import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';
import { auth } from "./lib/auth.config";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default auth((req) => {
  // Run intl middleware
  return intlMiddleware(req);
});

export const config = {
  // Match all pathnames except for
  // - /api (API routes)
  // - /_next (Next.js internals)
  // - /_static (inside /public)
  // - all root files inside /public (e.g. /favicon.ico)
  matcher: ['/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)']
};
