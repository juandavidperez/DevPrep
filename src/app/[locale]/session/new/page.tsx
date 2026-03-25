import { SessionConfigForm } from "@/components/session/SessionConfigForm";

export default function NewSessionPage() {
  return (
    <main className="min-h-screen bg-background text-on-surface font-body selection:bg-primary/30 antialiased overflow-x-hidden relative">
      <SessionConfigForm />
      
      {/* Background Decorative Elements */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-secondary/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
    </main>
  );
}
