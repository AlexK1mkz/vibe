"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { track } from "@/lib/client";
import { maskPhone, normalizePhone } from "@/lib/phone";

interface Strings {
  title: string;
  text: string;
  name: string;
  namePlaceholder: string;
  whatsapp: string;
  whatsappHint: string;
  consentBefore: string;
  consentLink: string;
  submit: string;
  sending: string;
  note: string;
  errors: Record<string, string>;
}

/** Форма контакта после короткого результата. Согласие без предустановки (ТЗ, п. 5.5). */
export function ContactForm({ publicId, strings }: { publicId: string; strings: Strings }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return; // защита от повторной отправки
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = strings.errors.name;
    if (!normalizePhone(phone)) next.whatsapp = strings.errors.whatsapp;
    if (!consent) next.consent = strings.errors.consent;
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const first = Object.keys(next)[0];
      document.getElementById(`contact-${first}`)?.focus();
      return;
    }
    setPending(true);
    try {
      const response = await fetch(`/api/leads/${publicId}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, whatsapp: phone, consent, website: honeypot.current?.value || "" }),
      });
      if (response.status === 422) {
        const data = (await response.json()) as { fields: Record<string, string> };
        setErrors(Object.fromEntries(Object.keys(data.fields).map((k) => [k, strings.errors[k]])));
        setPending(false);
        return;
      }
      if (response.status === 429) throw new Error("rate");
      if (!response.ok) throw new Error("server");
      track("contact_submit", {}, { leadId: publicId, onceKey: `contact_${publicId}` });
      router.refresh();
    } catch (error) {
      setErrors({ form: (error as Error).message === "rate" ? strings.errors.rate : strings.errors.server });
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="card" id="contact" aria-labelledby="contact-title">
      <h2 id="contact-title" className="text-2xl font-bold leading-tight">
        {strings.title}
      </h2>
      <p className="mt-2 text-muted">{strings.text}</p>

      <div className="mt-5">
        <label htmlFor="contact-name" className="text-sm font-semibold">
          {strings.name}
        </label>
        <input
          id="contact-name"
          name="name"
          className="field mt-1.5"
          autoComplete="given-name"
          placeholder={strings.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
          maxLength={80}
        />
        {errors.name && (
          <p id="contact-name-error" className="mt-1 text-sm font-semibold text-danger">
            {errors.name}
          </p>
        )}
      </div>

      <div className="mt-4">
        <label htmlFor="contact-whatsapp" className="text-sm font-semibold">
          {strings.whatsapp}
        </label>
        <input
          id="contact-whatsapp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="field mt-1.5 tabular-nums"
          value={phone}
          onChange={(e) => setPhone(maskPhone(e.target.value))}
          aria-invalid={Boolean(errors.whatsapp)}
          aria-describedby={errors.whatsapp ? "contact-whatsapp-error" : "contact-whatsapp-hint"}
        />
        {errors.whatsapp ? (
          <p id="contact-whatsapp-error" className="mt-1 text-sm font-semibold text-danger">
            {errors.whatsapp}
          </p>
        ) : (
          <p id="contact-whatsapp-hint" className="mt-1 text-xs text-muted">
            {strings.whatsappHint}
          </p>
        )}
      </div>

      <div className="mt-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            id="contact-consent"
            type="checkbox"
            className="mt-0.5 h-6 w-6 shrink-0 accent-[#164f46]"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "contact-consent-error" : undefined}
          />
          <span>
            {strings.consentBefore}
            <Link href="/privacy" target="_blank" className="underline">
              {strings.consentLink}
            </Link>
          </span>
        </label>
        {errors.consent && (
          <p id="contact-consent-error" className="mt-1 text-sm font-semibold text-danger">
            {errors.consent}
          </p>
        )}
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {errors.form && (
        <p role="alert" className="mt-4 text-sm font-semibold text-danger">
          {errors.form}
        </p>
      )}

      <button type="submit" className="btn btn-primary mt-5 w-full" disabled={pending}>
        {pending ? strings.sending : strings.submit}
      </button>
      <p className="mt-3 text-xs text-muted">{strings.note}</p>
    </form>
  );
}
