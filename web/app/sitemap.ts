import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const now = new Date();
  const staticPaths = [
    "",
    "/doctors",
    "/lab-tests",
    "/pharmacy",
    "/home-care",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/login",
    "/signup",
  ];
  const [doctors, specialties, cities] = await Promise.all([
    prisma.doctorProfile.findMany({
      where: { active: true, verifiedStatus: "APPROVED" },
      select: { slug: true, createdAt: true },
      take: 5000,
    }),
    prisma.specialty.findMany({ where: { active: true }, select: { slug: true } }),
    prisma.city.findMany({ where: { active: true }, select: { slug: true } }),
  ]);

  const entries: MetadataRoute.Sitemap = [
    ...staticPaths.map((p) => ({
      url: `${base}${p || "/"}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: p === "" ? 1 : 0.7,
    })),
    ...doctors.map((d) => ({
      url: `${base}/doctor/${d.slug}`,
      lastModified: d.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...specialties.map((s) => ({
      url: `${base}/doctors/${s.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  // Cross-product: specialty × city (shallow set)
  for (const s of specialties.slice(0, 5)) {
    for (const c of cities) {
      entries.push({
        url: `${base}/doctors/${s.slug}/${c.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      });
    }
  }
  return entries;
}
