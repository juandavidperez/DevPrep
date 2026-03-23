import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { getTranslations } from "next-intl/server";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const t = await getTranslations("Settings");

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-400">{t("subtitle")}</p>
        <SettingsForm
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
