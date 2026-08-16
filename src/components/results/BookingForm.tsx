"use client";

/**
 * The lead-capture form: contact details, preferred channel and notes.
 * Validates client-side, submits via bookQuoteAction and forwards to the
 * confirmation page with the carrier's contact card in the query string.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { bookQuoteAction } from "@/lib/actions";
import type { LeadContact } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CONTACT_CHANNELS: Array<{ value: LeadContact["preferredContact"]; label: string }> = [
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
];

type FieldErrors = Partial<Record<"name" | "email" | "phone", string>>;

export default function BookingForm({
  quoteId,
  serviceId,
  carrierName,
  requiresManualQuote,
}: {
  quoteId: string;
  serviceId: string;
  carrierName: string;
  requiresManualQuote: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredContact, setPreferredContact] =
    useState<LeadContact["preferredContact"]>("phone");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (name.trim().length === 0) {
      next.name = "Please enter your name.";
    }
    if (!EMAIL_RE.test(email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (phone.replace(/\D/g, "").length < 7) {
      next.phone = "Please enter a phone number with at least 7 digits.";
    }
    return next;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fieldErrors = validate();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setServerError(null);
    startTransition(async () => {
      try {
        const { leadId, carrier } = await bookQuoteAction({
          quoteId,
          serviceId,
          contact: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            preferredContact,
            notes: notes.trim() === "" ? undefined : notes.trim(),
          },
        });
        const query = new URLSearchParams({
          service: serviceId,
          lead: leadId,
          name: carrier.companyName,
          email: carrier.contactEmail,
          phone: carrier.contactPhone,
        });
        router.push(`/quote/${quoteId}/booked?${query.toString()}`);
      } catch (error) {
        setServerError(
          error instanceof Error && error.message
            ? error.message
            : "Something went wrong sending your request. Please try again.",
        );
      }
    });
  }

  const inputClass = (invalid: boolean) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm text-brand-950 placeholder:text-brand-300 focus:border-brand-500 ${
      invalid ? "border-accent-400" : "border-brand-200"
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label
          htmlFor="booking-name"
          className="text-xs font-semibold uppercase tracking-wide text-brand-700"
        >
          Your name
        </label>
        <input
          id="booking-name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ayşe Yılmaz"
          aria-invalid={Boolean(errors.name)}
          className={`mt-1.5 ${inputClass(Boolean(errors.name))}`}
        />
        {errors.name && <p className="mt-1 text-xs text-accent-700">{errors.name}</p>}
      </div>

      <div>
        <label
          htmlFor="booking-email"
          className="text-xs font-semibold uppercase tracking-wide text-brand-700"
        >
          Email address
        </label>
        <input
          id="booking-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-invalid={Boolean(errors.email)}
          className={`mt-1.5 ${inputClass(Boolean(errors.email))}`}
        />
        {errors.email && <p className="mt-1 text-xs text-accent-700">{errors.email}</p>}
      </div>

      <div>
        <label
          htmlFor="booking-phone"
          className="text-xs font-semibold uppercase tracking-wide text-brand-700"
        >
          Phone number
        </label>
        <input
          id="booking-phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+44 7700 900123 or +90 532 000 00 00"
          aria-invalid={Boolean(errors.phone)}
          className={`mt-1.5 ${inputClass(Boolean(errors.phone))}`}
        />
        {errors.phone && <p className="mt-1 text-xs text-accent-700">{errors.phone}</p>}
      </div>

      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          How should they contact you?
        </legend>
        <div className="mt-1.5 inline-flex rounded-full border border-brand-200 bg-white p-1">
          {CONTACT_CHANNELS.map((channel) => (
            <button
              key={channel.value}
              type="button"
              aria-pressed={preferredContact === channel.value}
              onClick={() => setPreferredContact(channel.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                preferredContact === channel.value
                  ? "bg-brand-900 text-white"
                  : "text-brand-700 hover:bg-brand-50"
              }`}
            >
              {channel.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="booking-notes"
          className="text-xs font-semibold uppercase tracking-wide text-brand-700"
        >
          Notes <span className="font-normal normal-case text-brand-400">(optional)</span>
        </label>
        <textarea
          id="booking-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything the company should know — parking, floors, fragile items…"
          className={`mt-1.5 ${inputClass(false)}`}
        />
      </div>

      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-accent-300 bg-accent-50 px-4 py-3 text-sm text-accent-800"
        >
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-cta px-6 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending
          ? "Sending your request…"
          : requiresManualQuote
            ? "Request a price"
            : "Send booking request"}
      </button>

      <p className="text-xs leading-relaxed text-brand-500">
        {requiresManualQuote
          ? `By requesting a price you agree we share these details with ${carrierName} so they can price and arrange your shipment.`
          : `By booking you agree we share these details with ${carrierName} so they can arrange your shipment.`}{" "}
        <Link
          href="/privacy"
          className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-900"
        >
          Privacy policy
        </Link>
      </p>
    </form>
  );
}
