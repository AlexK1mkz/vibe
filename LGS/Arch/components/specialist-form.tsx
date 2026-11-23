"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { getUtm, track } from "@/lib/client";
import { maskPhone, normalizePhone } from "@/lib/phone";
import {
  isSpecialistRole,
  normalizeProfileUrl,
  SPECIALIST_LIMITS as LIMITS,
  type SpecialistFormStrings,
} from "@/lib/specialists";

interface Shared {
  consentBefore: string;
  consentLink: string;
  sending: string;
  whatsappHint: string;
  errors: Record<string, string>;
}

const EMPTY = {
  name: "",
  whatsapp: "+7",
  city: "",
  role: "",
  education: "",
  certificate: "",
  practiceHours: "",
  weeklyHours: "",
  profileUrl: "",
  motivation: "",
};
type Key = keyof typeof EMPTY;
type TextKey = Exclude<Key, "whatsapp" | "role" | "motivation">;

/** Обязательные текстовые поля после выбора роли, в порядке на экране */
const AFTER_ROLE: TextKey[] = ["education", "certificate", "practiceHours", "weeklyHours"];

/** Анкета специалиста (ТЗ v2, раздел 8.3). Все подписи приходят из content/specialists.json. */
export function SpecialistForm({ strings, shared }: { strings: SpecialistFormStrings; shared: Shared }) {
  const router = useRouter();
  const [values, setValues] = useState(EMPTY);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);
  const started = useRef(false);
  /** Замок от повторной отправки: состояние pending обновляется не сразу */
  const locked = useRef(false);

  /** Первый ввод в любое поле: событие уходит один раз */
  const markStart = () => {
    if (started.current) return;
    started.current = true;
    track("specialist_form_start", { audience: "specialist" }, { onceKey: "specialist_form_start" });
  };

  const set = (key: Key, value: string) => {
    markStart();
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      if (!e[key] && !e.form) return e;
      const next = { ...e };
      delete next[key];
      delete next.form;
      return next;
    });
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (values.name.trim().length < 2) e.name = shared.errors.name;
    if (!normalizePhone(values.whatsapp)) e.whatsapp = shared.errors.whatsapp;
    if (!values.city.trim()) e.city = shared.errors.required;
    if (!isSpecialistRole(values.role)) e.role = strings.errors.role;
    for (const key of AFTER_ROLE) if (!values[key].trim()) e[key] = shared.errors.required;
    if (normalizeProfileUrl(values.profileUrl) === false) e.profileUrl = strings.errors.profileUrl;
    if (!values.motivation.trim()) e.motivation = strings.errors.motivation;
    if (!consent) e.consent = shared.errors.consent;
    return e;
  };

  const showErrors = (e: Record<string, string>) => {
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first && first !== "form") document.getElementById(`sp-${first}`)?.focus();
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (locked.current) return;
    const e = validate();
    if (Object.keys(e).length > 0) {
      showErrors(e);
      return;
    }
    locked.current = true;
    setPending(true);
    try {
      const response = await fetch("/api/specialists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, consent, utm: getUtm(), website: honeypot.current?.value || "" }),
      });
      if (response.status === 429) throw new Error("rate");
      if (response.status === 422) throw new Error("validation");
      if (!response.ok) throw new Error("server");
      track("specialist_submit", { role: values.role, audience: "specialist" });
      // Замок не снимаем: до перехода на «Спасибо» форма остаётся заблокированной
      router.push("/thanks?type=specialist");
    } catch (error) {
      const kind = (error as Error).message;
      setErrors({
        form: kind === "rate" ? shared.errors.rate : kind === "validation" ? strings.errors.validation : shared.errors.server,
      });
      locked.current = false;
      setPending(false);
    }
  };

  const error = (key: string) =>
    errors[key] ? (
      <p id={`sp-${key}-error`} className="mt-1.5 text-sm font-semibold text-danger">
        {errors[key]}
      </p>
    ) : null;

  const label = (key: Key, text: string, optional = false) => (
    <label htmlFor={`sp-${key}`} className="text-sm font-semibold">
      {text}
      {optional && <span className="font-normal text-muted"> · {strings.optional}</span>}
    </label>
  );

  const text = (
    key: TextKey,
    title: string,
    options: { placeholder?: string; optional?: boolean; autoComplete?: string; inputMode?: "text" | "url" } = {},
  ) => (
    <div className="mt-5">
      {label(key, title, options.optional)}
      <input
        id={`sp-${key}`}
        name={key}
        className="field mt-1.5"
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={options.placeholder}
        maxLength={LIMITS[key]}
        autoComplete={options.autoComplete ?? "off"}
        inputMode={options.inputMode}
        autoCapitalize={options.inputMode === "url" ? "none" : undefined}
        required={!options.optional}
        aria-required={!options.optional}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `sp-${key}-error` : undefined}
      />
      {error(key)}
    </div>
  );

  const motivationLeft = strings.motivationCounter
    .replace("{count}", String(values.motivation.length))
    .replace("{max}", String(LIMITS.motivation));

  return (
    <form onSubmit={onSubmit} noValidate className="card relative scroll-mt-6 sm:!p-8" id="form" aria-labelledby="sp-title">
      <h3 id="sp-title" className="text-2xl font-bold">
        {strings.formTitle}
      </h3>

      {text("name", strings.name, { placeholder: strings.namePlaceholder, autoComplete: "given-name" })}

      <div className="mt-5">
        {label("whatsapp", strings.whatsapp)}
        <input
          id="sp-whatsapp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="field mt-1.5 tabular-nums"
          value={values.whatsapp}
          onChange={(e) => set("whatsapp", maskPhone(e.target.value))}
          required
          aria-required="true"
          aria-invalid={Boolean(errors.whatsapp)}
          aria-describedby={errors.whatsapp ? "sp-whatsapp-error" : "sp-whatsapp-hint"}
        />
        {error("whatsapp") ?? (
          <p id="sp-whatsapp-hint" className="mt-1.5 text-xs text-muted">
            {shared.whatsappHint}
          </p>
        )}
      </div>

      {text("city", strings.city, { placeholder: strings.cityPlaceholder })}

      <fieldset
        className="mt-6"
        role="radiogroup"
        aria-required="true"
        aria-invalid={Boolean(errors.role)}
        aria-describedby={errors.role ? "sp-role-error" : values.role === "trainer" ? "sp-role-hint" : undefined}
      >
        <legend className="text-sm font-semibold">{strings.role}</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {Object.entries(strings.roles).map(([value, title], i) => (
            <label
              key={value}
              className={`flex min-h-14 cursor-pointer items-center justify-center rounded-[14px] border-[1.5px] px-1 text-center text-[15px] font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                values.role === value ? "border-accent bg-accent text-on-accent" : "border-line bg-bg hover:border-accent"
              }`}
            >
              <input
                id={i === 0 ? "sp-role" : undefined}
                type="radio"
                name="role"
                value={value}
                checked={values.role === value}
                onChange={() => set("role", value)}
                className="sr-only"
              />
              {title}
            </label>
          ))}
        </div>
        {error("role") ??
          (values.role === "trainer" && (
            <p id="sp-role-hint" className="mt-2 text-sm text-accent">
              {strings.trainerHint}
            </p>
          ))}
      </fieldset>

      {text("education", strings.education, { placeholder: strings.educationPlaceholder })}
      {text("certificate", strings.certificate, { placeholder: strings.certificatePlaceholder })}
      {text("practiceHours", strings.practiceHours, { placeholder: strings.practiceHoursPlaceholder })}
      {text("weeklyHours", strings.weeklyHours, { placeholder: strings.weeklyHoursPlaceholder })}
      {text("profileUrl", strings.profileUrl, {
        placeholder: strings.profileUrlPlaceholder,
        optional: true,
        autoComplete: "url",
        inputMode: "url",
      })}

      <div className="mt-5">
        {label("motivation", strings.motivation)}
        <textarea
          id="sp-motivation"
          name="motivation"
          className="field mt-1.5 block min-h-32 resize-y"
          rows={4}
          value={values.motivation}
          onChange={(e) => set("motivation", e.target.value.slice(0, LIMITS.motivation))}
          placeholder={strings.motivationPlaceholder}
          maxLength={LIMITS.motivation}
          required
          aria-required="true"
          aria-invalid={Boolean(errors.motivation)}
          aria-describedby={errors.motivation ? "sp-motivation-error sp-motivation-counter" : "sp-motivation-counter"}
        />
        <div className="mt-1.5 flex items-start justify-between gap-4">
          <div>{error("motivation")}</div>
          <p id="sp-motivation-counter" className="shrink-0 text-xs tabular-nums text-muted">
            {motivationLeft}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            id="sp-consent"
            type="checkbox"
            className="mt-0.5 h-6 w-6 shrink-0 accent-accent"
            checked={consent}
            onChange={(e) => {
              markStart();
              setConsent(e.target.checked);
              setErrors((prev) => {
                if (!prev.consent) return prev;
                const next = { ...prev };
                delete next.consent;
                return next;
              });
            }}
            required
            aria-required="true"
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "sp-consent-error" : undefined}
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
        <p role="alert" className="mt-5 text-sm font-semibold text-danger">
          {errors.form}
        </p>
      )}

      <button type="submit" className="btn btn-primary mt-6 w-full" disabled={pending} aria-busy={pending}>
        {pending ? shared.sending : strings.submit}
      </button>
    </form>
  );
}
