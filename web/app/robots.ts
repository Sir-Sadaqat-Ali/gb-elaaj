import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/doctors", "/doctor", "/lab-tests", "/pharmacy", "/home-care", "/about", "/contact", "/privacy", "/terms"],
        disallow: ["/api", "/patient", "/doctor/dashboard", "/doctor/appointments", "/doctor/schedule", "/doctor/time-slots", "/doctor/patients", "/doctor/lab-reports", "/doctor/prescriptions", "/doctor/earnings", "/doctor/withdrawals", "/doctor/public-profile", "/doctor/video-room", "/admin", "/finance", "/pharmacy-admin", "/lab-admin", "/nurse"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
