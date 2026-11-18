"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { getUtm, track } from "@/lib/client";
import { maskPhone, normalizePhone } from "@/lib/phone";

interface Strings {
  title: string;
  name: string;
  whatsapp: string;
  level: string;
  levels: Record<string, string>;
  education: string;
  educationPlaceholder: string;
  practiceHours: string;
  practiceHoursPlaceholder: string;
  weeklyHours: string;
  weeklyHoursPlaceholder: string;
  submit: string;
}

interface Shared {
  consentBefore: string;
  consentLink: string;
  sending: string;
  whatsappHint: string;
  errors: Record<string, string>;
}

/** Анкета специалиста: пять вопросов (ТЗ, п. 4.2) */
export function SpecialistForm({ strings, shared }: { strings: Strings; shared: Shared }) {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", whatsapp: "+7", level: "", education: "", practiceHours: "", weeklyHours: "" });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof values, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    const e: Record<string, string> = {};
    if (values.name.trim().length < 2) e.name = shared.errors.name;
    if (!normalizePhone(values.whatsapp)) e.whatsapp = shared.errors.whatsapp;
    if (!values.level) e.level = shared.errors.level;
    for (const key of ["education", "practiceHours", "weeklyHours"] as const) {
      if (!values[key].trim()) e[key] = shared.errors.required;
    }
    if (!consent) e.consent = shared.errors.consent;
    setErrors(e);
    if (Object.keys(e).length > 0) {
      document.getElementById(`sp-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/specialists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, consent, utm: getUtm(), website: honeypot.current?.value || "" }),
      });
      if (response.status === 429) throw new Error("rate");
      if (!response.ok) throw new Error("server");
      track("specialist_submit", { level: values.level });
      router.push("/thanks?type=specialist");
    } catch (error) {
      setErrors({ form: (error as Error).message === "rate" ? shared.errors.rate : shared.errors.server });
      setPending(false);
    }
  };

  const error = (key: string) =>
    errors[key] ? (
      <p id={`sp-${key}-error`} className="mt-1 text-sm font-semibold text-danger">
        {errors[key]}
      </p>
    ) : null;

  const text = (key: "name" | "education" | "practiceHours" | "weeklyHours", label: string, placeholder?: string, max = 80) => (
    <div className="mt-4">
      <label htmlFor={`sp-${key}`} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={`sp-${key}`}
        className="field mt-1.5"
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        maxLength={max}
        autoComplete={key === "name" ? "given-name" : "off"}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `sp-${key}-error` : undefined}
      />
      {error(key)}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="card" id="form" aria-labelledby="sp-title">
      <h2 id="sp-title" className="text-2xl font-bold">
        {strings.title}
      </h2>

      {text("name", strings.name)}

      <div className="mt-4">
        <label htmlFor="sp-whatsapp" className="text-sm font-semibold">
          {strings.whatsapp}
        </label>
        <input
          id="sp-whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="field mt-1.5 tabular-nums"
          value={values.whatsapp}
          onChange={(e) => set("whatsapp", maskPhone(e.target.value))}
          aria-invalid={Boolean(errors.whatsapp)}
          aria-describedby={errors.whatsapp ? "sp-whatsapp-error" : "sp-whatsapp-hint"}
        />
        {error("whatsapp") ?? (
          <p id="sp-whatsapp-hint" className="mt-1 text-xs text-muted">
            {shared.whatsappHint}
          </p>
        )}
      </div>

      <fieldset className="mt-5" aria-describedby={errors.level ? "sp-level-error" : undefined}>
        <legend className="text-sm font-semibold">{strings.level}</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {Object.entries(strings.levels).map(([value, label], i) => (
            <label
              key={value}
              className={`flex min-h-14 cursor-pointer items-center justify-center rounded-xl border-[1.5px] px-2 text-center font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-green ${
                values.level === value ? "border-green bg-green text-white" : "border-line bg-white"
              }`}
            >
              <input
                id={i === 0 ? "sp-level" : undefined}
                type="radio"
                name="level"
                value={value}
                checked={values.level === value}
                onChange={() => set("level", value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
        {error("level")}
      </fieldset>

      {text("education", strings.education, strings.educationPlaceholder, 400)}
      {text("practiceHours", strings.practiceHours, strings.practiceHoursPlaceholder, 60)}
      {text("weeklyHours", strings.weeklyHours, strings.weeklyHoursPlaceholder, 60)}

      <div className="mt-5">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            id="sp-consent"
            type="checkbox"
            className="mt-0.5 h-6 w-6 shrink-0 accent-[#164f46]"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            aria-invalid={Boolean(errors.consent)}
          />
          <span>
            {shared.consentBefore}
            <Link href="/privacy" target="_blank" className="underline">
              {shared.consentLink}
            </Link>
          </span>
        </label>
        {error("consent")}
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {errors.form && (
        <p role="alert" className="mt-4 text-sm font-semibold text-danger">
          {errors.form}
        </p>
      )}

      <button type="submit" className="btn btn-primary mt-6 w-full" disabled={pending}>
        {pending ? shared.sending : strings.submit}
      </button>
    </form>
  );
}
