import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { getTranslations } from "next-intl/server";
import { getGlobalStats } from "@/lib/analytics";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const t = await getTranslations("Settings");

  const [settings, globalStats] = await Promise.all([
    prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    }),
    getGlobalStats(session.user.id),
  ]);

  const { totalSessions, avgScore } = globalStats;

  return (
    <main className="min-h-screen bg-background text-text-primary relative overflow-hidden pb-20">
      {/* Ambient backgrounds */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px' 
        }} 
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest mb-3">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {t("label")}
            </div>
            <h1 className="text-4xl font-black tracking-tight text-text-primary mb-2">
              {t("title")}
            </h1>
            <p className="text-text-secondary text-base max-w-xl">
              {t("subtitle")}
            </p>
          </div>
        </header>

        <SettingsForm
          userName={session.user.name || "Developer"}
          userImage={session.user.image || null}
          totalSessions={totalSessions}
          avgScore={avgScore}
          initialSettings={{
            uiLanguage: settings.uiLanguage,
            questionLanguage: settings.questionLanguage,
            defaultDifficulty: settings.defaultDifficulty,
            defaultCategories: settings.defaultCategories,
            targetStack: settings.targetStack,
            outputModality: settings.outputModality,
            voiceSpeed: settings.voiceSpeed,
          }}
        />
      </div>
    </main>
  );
}
