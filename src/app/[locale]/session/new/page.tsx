import { SessionConfigForm } from "@/components/session/SessionConfigForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function NewSessionPage() {
  const session = await auth();
  
  let settings = null;
  if (session?.user?.id) {
    settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    });
  }

  return (
    <div className="relative min-h-full">
      <SessionConfigForm settings={settings} />

      {/* Background Decorative Elements */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-secondary/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
    </div>
  );
}
