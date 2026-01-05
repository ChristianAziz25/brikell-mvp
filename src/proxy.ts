import { routing } from '@/i18n/routing';
import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';


export default function proxy(request: NextRequest) {
  return createMiddleware(routing)(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|.*\\.).*)?"],

};