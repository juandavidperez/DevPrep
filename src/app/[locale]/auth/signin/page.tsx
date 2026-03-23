"use client";

import { signIn } from "next-auth/react";
import { Login } from "@/components/Login";

export default function SignInPage() {
  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleGithubSignIn = () => {
    signIn("github", { callbackUrl: "/dashboard" });
  };

  return (
    <main>
      <Login 
        onGoogleSignIn={handleGoogleSignIn} 
        onGithubSignIn={handleGithubSignIn}
      />
    </main>
  );
}
