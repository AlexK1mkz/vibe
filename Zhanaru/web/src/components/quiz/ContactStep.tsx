// Последний шаг теста: имя, фамилия, телефон. После отправки результат открывается на карте,
// заявка уходит клинике (Telegram + Google-таблица), а посетитель переходит в WhatsApp с готовым сообщением.
import { ArrowLeft, LockKeyhole, MessageCircle } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import type { Answers } from '../../content/quiz';
import { ru } from '../../i18n/ru';
import { track } from '../../lib/analytics';
import { quizPayload, sendLead } from '../../lib/lead';
import { isPhoneComplete, nextPhone, phoneDigits } from '../../lib/phone';
import { score } from '../../lib/scoring';
import { resultWaLink } from '../../lib/whatsapp';
import { useQuiz } from './store';

const t = ru.contact;

export default function ContactStep({ answers }: { answers: Answers }) {
  const { contact, finish, back } = useQuiz();
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

    const result = score(answers);
    const name = `${firstName.trim()} ${lastName.trim()}`;
    // WhatsApp открываем сразу в обработчике клика — иначе браузер заблокирует окно
    window.open(resultWaLink(answers, result, { name }), '_blank', 'noopener');
    void sendLead({
      name: firstName.trim(),
      surname: lastName.trim(),
      phone: '+' + phoneDigits(phone),
      source: 'quiz',
      quiz: quizPayload(answers, result),
      elapsed: Date.now() - openedAt.current,
      website: trap.current?.value ?? '',
    });
    track('lead_whatsapp', { source: 'quiz_contact', segment: result.segment });
    track('lead_callback', { source: 'quiz_contact' });
    finish({ firstName: firstName.trim(), lastName: lastName.trim(), phone });
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
      <div className="flex items-center gap-4">
        <button
          type="button" onClick={back} aria-label={ru.quiz.back}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-ink transition-colors hover:border-brand hover:text-brand"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-medium text-muted">{t.step}</p>
          <div className="progress-track mt-2" aria-hidden="true"><div className="progress-fill" style={{ width: '100%' }} /></div>
        </div>
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
        <button type="submit" className="btn btn-wa mt-2 w-full" data-quiz-submit>
          <MessageCircle size={20} aria-hidden="true" /> {t.submit}
        </button>
        <p className="flex items-start gap-2 text-sm text-muted">
          <LockKeyhole size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {t.note}
        </p>
      </form>
    </div>
  );
}
