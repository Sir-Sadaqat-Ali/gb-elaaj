import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { SignupForm } from "./signup-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Create account | GB Elaaj" };

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) redirect(ROLE_HOME[session.user.role]);

  const [cities, specialties] = await Promise.all([
    prisma.city.findMany({
      where: { active: true },
      select: { id: true, nameEn: true, slug: true },
      orderBy: { nameEn: "asc" },
    }),
    prisma.specialty.findMany({
      where: { active: true },
      select: { id: true, nameEn: true, slug: true },
      orderBy: { nameEn: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="ge-display text-[28px] font-semibold text-ge-navy">Create your account</h1>
      <p className="mt-1 text-sm text-ge-muted">
        Join GB Elaaj — Healthcare network connecting Gilgit-Baltistan with certified medical care.
      </p>
      <div className="mt-6">
        <SignupForm cities={cities} specialties={specialties} />
      </div>
      <p className="mt-6 text-sm text-ge-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ge-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
