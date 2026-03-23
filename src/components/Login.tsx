"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";

interface LoginProps {
  onGoogleSignIn: () => void;
  onGithubSignIn?: () => void;
  onSSOSignIn?: () => void;
}

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GithubIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

export function Login({ onGoogleSignIn, onGithubSignIn, onSSOSignIn }: LoginProps) {
  const t = useTranslations("Login");

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#131313] font-sans text-white">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Radial Gradient overlay for depth — increased opacity to match Stitch */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.08)_0%,transparent_70%)]" />

      {/* Login Card — border radius adjusted to 0.75rem */}
      <div className="relative z-10 w-full max-w-[400px] px-6">
        <div className="flex flex-col items-center rounded-xl border border-white/10 bg-[#1a1a1a]/80 p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo / Icon */}
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 shadow-[0_0_20px_rgba(124,58,237,0.15)]">
            <ShieldCheck className="h-8 w-8 text-[#d2bbff]" />
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
              {t("welcome")}
            </h1>
            <p className="text-sm text-[#A1A1AA]">
              {t("subtitle")}
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={onGoogleSignIn}
            className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#1e1e1e] py-3.5 text-sm font-medium text-white transition-all duration-300 hover:border-violet-500/50 hover:bg-[#252525] hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] active:scale-[0.98]"
          >
            <GoogleIcon />
            {t("google")}
          </button>

          {/* Separator */}
          <div className="my-8 flex w-full items-center gap-4">
            <div className="h-[1px] flex-1 bg-white/5" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase">
              {t("systemEntry")}
            </span>
            <div className="h-[1px] flex-1 bg-white/5" />
          </div>

          {/* Secondary Buttons */}
          <div className="grid w-full grid-cols-2 gap-3">
            <button
              onClick={onGithubSignIn}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent py-2.5 text-xs font-medium text-white transition-all hover:bg-white/5 active:scale-[0.98]"
            >
              <GithubIcon />
              {t("github")}
            </button>
            <button
              onClick={onSSOSignIn}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent py-2.5 text-xs font-medium text-white transition-all hover:bg-white/5 active:scale-[0.98]"
            >
              <ShieldCheck className="h-4 w-4" />
              {t("sso")}
            </button>
          </div>

          {/* Terms */}
          <p className="mt-6 text-center text-[10px] text-white/30">
            {t("terms")}
          </p>
        </div>
      </div>

      {/* Footer Status — with version tag and monospace font */}
      <div className="absolute bottom-10 left-0 flex w-full justify-center">
        <div className="flex items-center gap-3 rounded-full border border-white/5 bg-black/20 px-4 py-2 backdrop-blur-md">
          <div className="flex h-2 w-2 relative">
            <div className="absolute inset-0 h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <div className="relative h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <span className="font-mono text-[10px] font-medium tracking-widest text-white/40">
            {t("statusOnline")}
          </span>
          <div className="h-3 w-[1px] bg-white/10" />
          <span className="font-mono text-[10px] tracking-widest text-white/25">
            {t("version")}
          </span>
        </div>
      </div>
    </div>
  );
}
