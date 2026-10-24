/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  typedRoutes: false,
  // Auth-driven paths must NEVER be cached. Without this, Vercel's edge and
  // browsers cache the 302 redirects (e.g. /api/auth/callback/credentials →
  // /admin/dashboard, and /admin/dashboard → /login), producing
  // ERR_TOO_MANY_REDIRECTS that no cookie-clearing can fix.
  async headers() {
    const noStore = [
      { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
      { key: "Pragma", value: "no-cache" },
    ];
    // Security headers per SECURITY_AUDIT.md §2 — applied to every response.
    // CSP deferred (needs careful test pass with Tailwind + Vercel Analytics).
    const security = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self), payment=(self)" },
    ];
    return [
      { source: "/(.*)", headers: security },
      { source: "/api/auth/:path*", headers: noStore },
      { source: "/login", headers: noStore },
      { source: "/signup", headers: noStore },
      { source: "/admin/:path*", headers: noStore },
      { source: "/patient/:path*", headers: noStore },
      { source: "/doctor/dashboard/:path*", headers: noStore },
      { source: "/doctor/appointments/:path*", headers: noStore },
      { source: "/doctor/schedule/:path*", headers: noStore },
      { source: "/doctor/time-slots/:path*", headers: noStore },
      { source: "/doctor/patients/:path*", headers: noStore },
      { source: "/doctor/lab-reports/:path*", headers: noStore },
      { source: "/doctor/prescriptions/:path*", headers: noStore },
      { source: "/doctor/earnings/:path*", headers: noStore },
      { source: "/doctor/withdrawals/:path*", headers: noStore },
      { source: "/doctor/public-profile/:path*", headers: noStore },
      { source: "/doctor/video-room/:path*", headers: noStore },
      { source: "/pharmacy-admin/:path*", headers: noStore },
      { source: "/lab-admin/:path*", headers: noStore },
      { source: "/nurse/:path*", headers: noStore },
      { source: "/finance/:path*", headers: noStore },
    ];
  },
};

export default nextConfig;
