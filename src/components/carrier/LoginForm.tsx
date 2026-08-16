"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { errorAlertClass, inputClass, labelClass, primaryButtonClass } from "./ui";

/** Email + password sign-in via Supabase. Only rendered in Supabase mode. */
export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "That email and password combination was not recognised. Please try again."
            : signInError.message,
        );
        setSubmitting(false);
        return;
      }
      router.push("/carrier/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong signing you in. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error ? (
        <div role="alert" className={errorAlertClass}>
          {error}
        </div>
      ) : null}
      <div>
        <label htmlFor="login-email" className={labelClass}>
          Email address
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
          placeholder="you@company.com"
        />
      </div>
      <div>
        <label htmlFor="login-password" className={labelClass}>
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
          placeholder="Your password"
        />
      </div>
      <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full`}>
        {submitting ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-brand-600">
        New to Bizim Kargo?{" "}
        <Link href="/carrier/signup" className="font-semibold text-brand-800 hover:text-brand-600">
          Create a carrier account
        </Link>
      </p>
    </form>
  );
}
