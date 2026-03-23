import Image from "next/image";
import { Link } from "@/navigation";
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('HomePage');
  
  // Note: auth check should probably happen in middleware or a separate component 
  // if we want to keep this as a simple client/server component using useTranslations.
  // In Next.js App Router, useTranslations works in both Server and Client components.

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-primary">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/logo-placeholder.svg"
          alt="DevPrep Logo"
          width={180}
          height={180}
          priority
        />
        <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-secondary text-lg">{t('subtitle')}</p>
        <Link
          href="/auth/signin"
          className="mt-6 rounded-xl bg-blue-600 px-8 py-3 text-sm font-medium transition hover:bg-blue-500"
        >
          {t('getStarted')}
        </Link>
      </div>
    </main>
  );
}
