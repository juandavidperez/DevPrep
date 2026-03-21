import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/logo-placeholder.svg"
          alt="DevPrep Logo"
          width={180}
          height={180}
          priority
        />
        <h1 className="text-4xl font-bold tracking-tight">DevPrep</h1>
        <p className="text-slate-400 text-lg">AI-Powered Interview Coach</p>
        <Link
          href="/auth/signin"
          className="mt-6 rounded-xl bg-blue-600 px-8 py-3 text-sm font-medium transition hover:bg-blue-500"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}
