import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Client-side routing için Firebase Auth state'ini kontrol etmek Next.js middleware'inde zor.
  // Bu yüzden basit middleware yapıyoruz.
  // AuthContext içinde zaten koruma var, sadece temel kontroller yapılabilir.
  // Bu projede Firebase client-side auth kullanıldığı için middleware yerine layout/client-side redirect daha sağlıklı.
  // Geri uyumluluk için, middleware sadece geçiş izni veriyor. AuthContext rotaları yönetecek.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|register).*)',
  ],
};
