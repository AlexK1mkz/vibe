// Форма заявки «имя + телефон». Отправляет JSON в public/api/lead.php;
// если сервер недоступен — предлагает WhatsApp (ТЗ 9.2).
import { useRef, useState, type FormEvent } from 'react';
import { site, waDefaultText, waLink } from '../../content/site';
import { ru } from '../../i18n/ru';
import { track } from '../../lib/analytics';
import { sendLead } from '../../lib/lead';
import { isPhoneComplete, nextPhone, phoneDigits } from '../../lib/phone';

const t = ru.form;

interface Props {
  source: string;
  /** Данные теста, которые прикладываются к заявке. */
  quiz?: Record<string, unknown>;
  /** Текст для WhatsApp, если отправить форму не получилось. */
  fallbackText?: string;
  /** После успешной отправки перейти на /thanks/. */
  redirect?: boolean;
  idPrefix?: string;
}

export default function LeadForm({ source, quiz, fallbackText = waDefaultText, redirect = false, idPrefix = 'lead' }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; consent?: string }>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'fail'>('idle');
  const openedAt = useRef(Date.now());
  const trap = useRef<HTMLInputElement>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = t.errorName;
    if (!isPhoneComplete(phone)) next.phone = t.errorPhone;
    if (!consent) next.consent = t.errorConsent;
    setErrors(next);
    if (Object.keys(next).length) return;

    setStatus('sending');
    const ok = await sendLead({
      name: name.trim(),
      phone: '+' + phoneDigits(phone),
      source,
      quiz,
      website: trap.current?.value ?? '', // honeypot
      elapsed: Date.now() - openedAt.current,
    });
    if (!ok) return setStatus('fail');
    track('lead_callback', { source });
    if (redirect) location.assign('/thanks/');
    else setStatus('done');
  }

  if (status === 'done') {
    return (
      <p role="status" className="rounded-2xl bg-goal-soft px-5 py-4 font-medium text-brand-deep">
        {t.success} {site.sla}.
      </p>
    );
  }

  const id = (s: string) => `${idPrefix}-${s}`;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-3" data-lead-form={source}>
      <div>
        <label htmlFor={id('name')} className="mb-1.5 block text-sm font-medium">{t.name}</label>
        <input
          id={id('name')} name="name" className="field" autoComplete="given-name" maxLength={60}
          value={name} onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors.name} aria-describedby={errors.name ? id('name-err') : undefined}
        />
        {errors.name && <p id={id('name-err')} className="mt-1 text-sm text-[#8A4B12]">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor={id('phone')} className="mb-1.5 block text-sm font-medium">{t.phone}</label>
        <input
          id={id('phone')} name="phone" className="field" type="tel" inputMode="tel" autoComplete="tel"
          placeholder="+7 (___) ___-__-__"
          value={phone} onChange={(e) => setPhone((prev) => nextPhone(prev, e.target.value))}
          aria-invalid={!!errors.phone} aria-describedby={errors.phone ? id('phone-err') : undefined}
        />
        {errors.phone && <p id={id('phone-err')} className="mt-1 text-sm text-[#8A4B12]">{errors.phone}</p>}
      </div>
      {/* honeypot: поле скрыто от людей, боты его заполняют */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input ref={trap} name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div>
        <label className="flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]"
            checked={consent} onChange={(e) => setConsent(e.target.checked)}
            aria-invalid={!!errors.consent}
          />
          <span>
            {t.consentBefore}{' '}
            <a href="/privacy/" target="_blank" className="text-brand underline underline-offset-2">{t.consentLink}</a>
          </span>
        </label>
        {errors.consent && <p className="mt-1 text-sm text-[#8A4B12]">{errors.consent}</p>}
      </div>
      <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
        {status === 'sending' ? t.sending : t.submit}
      </button>
      {status === 'fail' && (
        <div role="alert" className="rounded-2xl bg-now-soft px-5 py-4 text-sm">
          <p>{t.fail}</p>
          <a
            className="mt-2 inline-block font-semibold text-brand underline underline-offset-2"
            href={waLink(fallbackText)} target="_blank" rel="noopener"
            onClick={() => track('lead_whatsapp', { source: source + '_fallback' })}
          >
            {ru.common.writeWhatsapp}
          </a>
        </div>
      )}
    </form>
  );
}
