"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { COUNTRIES, type CountryCode } from "@/lib/types";

import { createCarrierProfileAction } from "@/app/carrier/actions";
import DemoBanner from "./DemoBanner";
import {
  errorAlertClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  selectClass,
} from "./ui";

interface SignupFormProps {
  /**
   * "signup"   — full account creation (email + password via Supabase auth);
   * "complete" — the user is already signed in but has no carrier profile
   *              (e.g. they confirmed their email later), so only the company
   *              profile is collected;
   * "demo"     — no Supabase: the form renders disabled with an explanation.
   */
  mode: "signup" | "complete" | "demo";
}

export default function SignupForm({ mode }: SignupFormProps) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [baseCountry, setBaseCountry] = useState<CountryCode>("GB");
  const [blurb, setBlurb] = useState("");
  const [years, setYears] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const demo = mode === "demo";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (demo) return;
    setError(null);

    if (mode === "signup" && password.length < 8) {
      setError("Please choose a password of at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        const supabase = createClient();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: "carrier",
              company_name: companyName,
              contact_name: contactName,
              phone,
              base_country: baseCountry,
              blurb,
              years_operating: years === "" ? null : Number(years),
            },
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          setSubmitting(false);
          return;
        }
        if (!data.session) {
          // Email confirmation is required before a session exists — the
          // profile gets created when they return and complete signup.
          setAwaitingConfirmation(true);
          setSubmitting(false);
          return;
        }
      }

      await createCarrierProfileAction({
        companyName,
        blurb,
        baseCountry,
        contactEmail: email,
        contactPhone: phone,
        yearsOperating: years === "" ? null : Number(years),
      });
      router.push("/carrier/rates/new?welcome=1");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong creating your account. Please try again.",
      );
      setSubmitting(false);
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <rect
              x="2"
              y="4.5"
              width="18"
              height="13"
              rx="2"
              fill="none"
              stroke="#047857"
              strokeWidth="1.6"
            />
            <path d="m3 6 8 6 8-6" fill="none" stroke="#047857" strokeWidth="1.6" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-brand-900">Check your inbox</h2>
        <p className="text-sm leading-relaxed text-brand-600">
          We’ve sent a confirmation link to{" "}
          <span className="font-semibold text-brand-900">{email}</span>. Click it,
          then sign in to finish setting up your company profile and publish your
          first rates.
        </p>
        <Link
          href="/carrier/login"
          className="inline-block text-sm font-semibold text-brand-800 hover:text-brand-600"
        >
          Go to carrier login →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {demo ? (
        <DemoBanner note="Signup is disabled, but the demo dashboard is viewable." />
      ) : null}
      {mode === "complete" ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-2.5 text-sm text-brand-800">
          You’re signed in — complete your company profile to start receiving
          leads.
        </p>
      ) : null}
      {error ? (
        <div role="alert" className={errorAlertClass}>
          {error}
        </div>
      ) : null}

      <fieldset disabled={demo || submitting} className="space-y-4">
        <div>
          <label htmlFor="su-company" className={labelClass}>
            Company name
          </label>
          <input
            id="su-company"
            type="text"
            required
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            className={inputClass}
            placeholder="e.g. Anadolu Express Cargo"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="su-contact" className={labelClass}>
              Contact name
            </label>
            <input
              id="su-contact"
              type="text"
              required
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              className={inputClass}
              placeholder="Who should we speak to?"
            />
          </div>
          <div>
            <label htmlFor="su-phone" className={labelClass}>
              Phone
            </label>
            <input
              id="su-phone"
              type="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={inputClass}
              placeholder="+44 or +90 number"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="su-email" className={labelClass}>
              {mode === "complete" ? "Contact email" : "Email address"}
            </label>
            <input
              id="su-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
              placeholder="bookings@company.com"
            />
          </div>
          {mode === "complete" ? (
            <div>
              <label htmlFor="su-country" className={labelClass}>
                Base country
              </label>
              <select
                id="su-country"
                value={baseCountry}
                onChange={(event) => setBaseCountry(event.target.value as CountryCode)}
                className={selectClass}
              >
                {(Object.keys(COUNTRIES) as CountryCode[]).map((code) => (
                  <option key={code} value={code}>
                    {COUNTRIES[code].flag} {COUNTRIES[code].name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="su-password" className={labelClass}>
                Password
              </label>
              <input
                id="su-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
                placeholder="At least 8 characters"
              />
            </div>
          )}
        </div>

        {mode !== "complete" ? (
          <div>
            <label htmlFor="su-country" className={labelClass}>
              Base country
            </label>
            <select
              id="su-country"
              value={baseCountry}
              onChange={(event) => setBaseCountry(event.target.value as CountryCode)}
              className={selectClass}
            >
              {(Object.keys(COUNTRIES) as CountryCode[]).map((code) => (
                <option key={code} value={code}>
                  {COUNTRIES[code].flag} {COUNTRIES[code].name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label htmlFor="su-blurb" className={labelClass}>
            About your company
          </label>
          <textarea
            id="su-blurb"
            required
            rows={3}
            value={blurb}
            onChange={(event) => setBlurb(event.target.value)}
            className={inputClass}
            placeholder="Routes you run, how often you depart, what makes you good."
          />
          <p className="mt-1 text-xs text-brand-500">
            Shown to customers next to your quotes.
          </p>
        </div>

        <div>
          <label htmlFor="su-years" className={labelClass}>
            Years operating <span className="font-normal normal-case">(optional)</span>
          </label>
          <input
            id="su-years"
            type="number"
            min={0}
            max={150}
            inputMode="numeric"
            value={years}
            onChange={(event) => setYears(event.target.value)}
            className={`${inputClass} no-spinner`}
            placeholder="e.g. 8"
          />
        </div>

        <button type="submit" disabled={demo || submitting} className={`${primaryButtonClass} w-full`}>
          {submitting
            ? "Creating your account…"
            : mode === "complete"
              ? "Complete profile"
              : "Create carrier account"}
        </button>
      </fieldset>

      {demo ? (
        <p className="text-center text-sm text-brand-600">
          <Link
            href="/carrier/login"
            className="font-semibold text-brand-800 hover:text-brand-600"
          >
            View the demo dashboard instead →
          </Link>
        </p>
      ) : (
        <p className="text-center text-sm text-brand-600">
          Already registered?{" "}
          <Link href="/carrier/login" className="font-semibold text-brand-800 hover:text-brand-600">
            Sign in
          </Link>
        </p>
      )}
    </form>
  );
}
