// Первый шаг теста: имя, фамилия, телефон. Заявка уходит клинике сразу (Telegram + Google-таблица),
// чтобы помощник врача мог связаться, даже если человек бросит тест. Ответы дописываются в ту же заявку в конце.
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { ru } from '../../i18n/ru';
import { track } from '../../lib/analytics';
import { newLeadId, sendLead } from '../../lib/lead';
import { isPhoneComplete, nextPhone, phoneDigits } from '../../lib/phone';
import { useQuiz } from './store';

const t = ru.contact;

export default function ContactStep() {
  const { contact, setContact } = useQuiz();
  const [firstName, setFirstName] = useState(contact?.firstName ?? '');
  const [lastName, setLastName] = useState(contact?.lastName ?? '');
  const [phone, setPhone] = useState(contact?.phone ?? '');
  const [consent, setConsent] = useState(!!contact);
  const [errors, setErrors] = useState<Partial<Record<'firstName' | 'lastName' | 'phone' | 'consent', string>>>({});
  const openedAt = useRef(Date.now());
  const trap = useRef<HTMLInputElement>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (firstName.trim().length < 2) next.firstName = t.errorFirst;
    if (lastName.trim().length < 2) next.lastName = t.errorLast;
    if (!isPhoneComplete(phone)) next.phone = ru.form.errorPhone;
    if (!consent) next.consent = ru.form.errorConsent;
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`c-${Object.keys(next)[0]}`)?.focus();
      return;
    }

    const same = contact && contact.phone === phone && contact.firstName === firstName.trim() && contact.lastName === lastName.trim();
    const leadId = same ? contact.leadId : newLeadId();
    if (!same) {
      void sendLead({
        leadId,
        stage: 'contact',
        name: firstName.trim(),
        surname: lastName.trim(),
        phone: '+' + phoneDigits(phone),
        source: 'quiz',
        elapsed: Date.now() - openedAt.current,
        website: trap.current?.value ?? '',
      });
      track('lead_callback', { source: 'quiz_contact' });
    }
    setContact({ firstName: firstName.trim(), lastName: lastName.trim(), phone, leadId });
  }

  const field = (key: keyof typeof errors) => ({
    id: `c-${key}`,
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key] ? `c-${key}-err` : undefined,
  });
  const err = (key: keyof typeof errors) =>
    errors[key] && <p id={`c-${key}-err`} className="mt-1 text-sm text-[#8A4B12]">{errors[key]}</p>;

  return (
    <div className="card p-5 sm:p-8 lg:min-h-[620px] lg:p-10">
      <div>
        <p className="flex justify-between text-sm font-medium text-muted">
          <span>{t.step}</span><span className="tabular-nums">0%</span>
        </p>
        <div className="progress-track mt-2" aria-hidden="true"><div className="progress-fill" style={{ width: '4%' }} /></div>
      </div>

      <form onSubmit={onSubmit} noValidate className="step-in mt-6 grid gap-3 lg:mt-10" data-lead-form="quiz">
        <h3 className="h3 !text-[clamp(22px,2.6vw,30px)]">{t.title}</h3>
        <p className="text-muted">{t.lead}</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="c-firstName" className="mb-1.5 block text-sm font-medium">{t.firstName}</label>
            <input {...field('firstName')} className="field" autoComplete="given-name" maxLength={40}
              value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            {err('firstName')}
          </div>
          <div>
            <label htmlFor="c-lastName" className="mb-1.5 block text-sm font-medium">{t.lastName}</label>
            <input {...field('lastName')} className="field" autoComplete="family-name" maxLength={60}
              value={lastName} onChange={(e) => setLastName(e.target.value)} />
            {err('lastName')}
          </div>
        </div>
        <div>
          <label htmlFor="c-phone" className="mb-1.5 block text-sm font-medium">{t.phone}</label>
          <input {...field('phone')} className="field" type="tel" inputMode="tel" autoComplete="tel"
            placeholder="+7 (___) ___-__-__"
            value={phone} onChange={(e) => setPhone((prev) => nextPhone(prev, e.target.value))} />
          {err('phone')}
        </div>
        {/* honeypot: поле скрыто от людей, боты его заполняют */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>Website<input ref={trap} name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>
        <div>
          <label className="flex items-start gap-3 text-sm text-muted">
            <input
              {...field('consent')} type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]"
              checked={consent} onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              {ru.form.consentBefore}{' '}
              <a href="/privacy/" target="_blank" className="text-brand underline underline-offset-2">{ru.form.consentLink}</a>
            </span>
          </label>
          {err('consent')}
        </div>
        <button type="submit" className="btn btn-sun mt-2 w-full" data-quiz-submit>
          {t.submit} <ArrowRight size={20} aria-hidden="true" />
        </button>
        <p className="flex items-start gap-2 text-sm text-muted">
          <LockKeyhole size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {t.note}
        </p>
      </form>
    </div>
  );
}
