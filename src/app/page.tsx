import Image from "next/image";

export default function Home() {
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
      </div>
    </main>
  );
}
