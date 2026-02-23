"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="card w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Welcome to Produce Hub</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Sign in to manage inventory, recipes, and AI insights.
        </p>

        <button
          className="btn w-full"
          onClick={() =>
            signIn("google", {
              callbackUrl: "/dashboard"
            })
          }
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}