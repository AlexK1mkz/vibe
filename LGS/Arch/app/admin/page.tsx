import type { Metadata } from "next";
import { adminEnabled, isAdmin } from "@/lib/admin-auth";
import { getStats, listApplications, listLeads, type BreakdownRow, type LeadFilters } from "@/lib/admin-stats";
import { archetypeName, countDrafts, test, type ArchetypeCode } from "@/lib/content";
import { getDictionary } from "@/dictionaries";
import { getcourseConfigured } from "@/integrations/getcourse";

export const metadata: Metadata = { title: "Админка", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const t = getDictionary();
const STATUS: Record<string, string> = {
  test_done: "Тест пройден",
  contact_given: "Контакт",
  consult_paid: "Консультация оплачена",
  intensive_paid: "Интенсив оплачен",
  intensive_vip_paid: "VIP оплачен",
};
const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—");
const dt = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Almaty" }).format(d) : "";

function Login({ error }: { error: boolean }) {
  return (
    <main className="container-narrow py-24">
      <h1 className="text-3xl font-extrabold">Админка</h1>
      {!adminEnabled() ? (
        <p className="mt-4 text-muted">Вход закрыт: задайте переменную окружения ADMIN_PASSWORD.</p>
      ) : (
        <form method="post" action="/api/admin/login" className="mt-6 max-w-sm">
          <label htmlFor="password" className="text-sm font-semibold">
            Пароль
          </label>
          <input id="password" name="password" type="password" className="field mt-1.5" autoComplete="current-password" required />
          {error && <p className="mt-2 text-sm font-semibold text-danger">Неверный пароль</p>}
          <button className="btn btn-primary mt-4 w-full">Войти</button>
        </form>
      )}
    </main>
  );
}

function Breakdown({ title, rows, label }: { title: string; rows: BreakdownRow[]; label?: (key: string) => string }) {
  return (
    <div className="card overflow-x-auto !p-5">
      <h3 className="font-bold">{title}</h3>
      <table className="mt-3 w-full text-sm">
        <thead className="text-left text-muted">
          <tr>
            <th className="py-1 font-semibold"> </th>
            <th className="py-1 text-right font-semibold">Тест</th>
            <th className="py-1 text-right font-semibold">Контакт</th>
            <th className="py-1 text-right font-semibold">Оплата</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="py-2 text-muted">
                Пока нет данных
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-line">
              <td className="py-1.5">{label ? label(row.key) : row.key}</td>
              <td className="py-1.5 text-right tabular-nums">{row.total}</td>
              <td className="py-1.5 text-right tabular-nums">
                {row.contact} <span className="text-muted">({pct(row.contact, row.total)})</span>
              </td>
              <td className="py-1.5 text-right tabular-nums">
                {row.paid} <span className="text-muted">({pct(row.paid, row.total)})</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Select({ name, label, value, options }: { name: string; label: string; value?: string; options: [string, string][] }) {
  return (
    <label className="text-xs font-semibold text-muted">
      {label}
      <select name={name} defaultValue={value ?? ""} className="mt-1 block min-h-11 rounded-lg border border-line bg-white px-2 text-sm text-ink">
        <option value="">Все</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  if (!(await isAdmin())) return <Login error={params.error === "1"} />;

  const filters: LeadFilters = {
    segment: params.segment || undefined,
    archetype: params.archetype || undefined,
    job: params.job || undefined,
    status: params.status || undefined,
    utm: params.utm || undefined,
  };
  const [stats, leads, applications] = await Promise.all([getStats(), listLeads(filters), listApplications()]);
  const drafts = countDrafts();
  const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]).toString();
  const name = (code: string) => archetypeName(code as ArchetypeCode);
  const top = Math.max(stats.funnel[0].value, stats.funnel[1].value);

  return (
    <main className="mx-auto max-w-[1280px] px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Админка: тест «Архетип личности»</h1>
        <form method="post" action="/api/admin/logout">
          <button className="text-sm font-semibold underline">Выйти</button>
        </form>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className={`rounded-lg px-3 py-1.5 font-semibold ${drafts.draft > 0 ? "bg-[#fff3c4] text-[#7a5b00]" : "bg-lime text-deep"}`}>
          Неутверждённых текстов: {drafts.draft} из {drafts.total}
        </span>
        <span className="rounded-lg bg-white px-3 py-1.5">GetCourse: {getcourseConfigured() ? "подключён" : "заглушка"}</span>
        <span className="rounded-lg bg-white px-3 py-1.5">WhatsApp: {process.env.WHATSAPP_PROVIDER || "stub"}</span>
        <span className="rounded-lg bg-white px-3 py-1.5">CRM-вебхук: {process.env.LEAD_WEBHOOK_URL ? "задан" : "не задан"}</span>
      </div>

      <h2 className="mt-8 text-xl font-bold">Воронка</h2>
      <ol className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.funnel.map((step, i) => (
          <li key={step.key} className="card !p-4">
            <p className="text-xs font-semibold text-muted">{step.label}</p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums">{step.value}</p>
            <p className="text-xs text-muted">{i === 0 ? " " : `${pct(step.value, top)} от начавших`}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <Breakdown title="По сегменту" rows={stats.bySegment} />
        <Breakdown title="По архетипу" rows={stats.byArchetype} label={name} />
        <Breakdown title="По работе" rows={stats.byJob} label={(k) => t.jobs[k] ?? k} />
        <Breakdown title="По utm_source" rows={stats.byUtm} />
      </div>

      <h2 className="mt-8 text-xl font-bold">Доля отказов по вопросам</h2>
      <div className="card mt-3 overflow-x-auto !p-5">
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-1 font-semibold">№</th>
              <th className="py-1 font-semibold">Вопрос</th>
              <th className="py-1 text-right font-semibold">Ответили</th>
              <th className="py-1 text-right font-semibold">Ушли на этом вопросе</th>
            </tr>
          </thead>
          <tbody>
            {stats.questions.map((q) => (
              <tr key={q.n} className="border-t border-line">
                <td className="py-1.5 tabular-nums">{q.n}</td>
                <td className="py-1.5">{test.questions[q.n - 1]?.text}</td>
                <td className="py-1.5 text-right tabular-nums">{q.answered}</td>
                <td className={`py-1.5 text-right tabular-nums ${q.dropOff >= 0.15 ? "font-bold text-danger" : ""}`}>
                  {q.n === 1 ? "—" : `${Math.round(q.dropOff * 100)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-xl font-bold">Лиды</h2>
      <form method="get" className="mt-3 flex flex-wrap items-end gap-3">
        <Select name="segment" label="Сегмент" value={filters.segment} options={[["A", "A"], ["B", "B"], ["specialist", "specialist"]]} />
        <Select name="archetype" label="Архетип" value={filters.archetype} options={test.archetypes.map((c) => [c, name(c)])} />
        <Select name="job" label="Работа" value={filters.job} options={Object.entries(t.jobs)} />
        <Select name="status" label="Статус" value={filters.status} options={Object.entries(STATUS)} />
        <Select name="utm" label="utm_source" value={filters.utm} options={stats.byUtm.filter((r) => r.key !== "—").map((r) => [r.key, r.key])} />
        <button className="btn btn-primary !min-h-11 !px-4 !py-2 !text-sm">Показать</button>
        <a href={`/api/admin/export${query ? `?${query}` : ""}`} className="btn btn-ghost !min-h-11 !px-4 !py-2 !text-sm">
          Выгрузить CSV
        </a>
      </form>

      <div className="card mt-3 overflow-x-auto !p-0">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-cream text-left text-muted">
            <tr>
              {["Дата", "Имя", "WhatsApp", "Архетип", "Работа", "Сегмент", "Статус", "UTM", ""].map((h) => (
                <th key={h} className="px-3 py-2 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-muted">
                  Лидов пока нет
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-line align-top">
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">{dt(lead.createdAt)}</td>
                <td className="px-3 py-2">{lead.name ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                  {lead.whatsapp ?? "—"}
                  {lead.whatsappOptOut && <span className="ml-1 text-xs text-danger">отписан</span>}
                </td>
                <td className="px-3 py-2">
                  <a href={`/result/${lead.publicId}`} className="underline">
                    {name(lead.primary)}
                    {lead.isPair ? " и " : " / "}
                    {name(lead.secondary)}
                  </a>
                </td>
                <td className="px-3 py-2">{t.jobs[lead.job] ?? lead.job}</td>
                <td className="px-3 py-2 font-semibold">{lead.segment}</td>
                <td className="px-3 py-2">{STATUS[lead.status] ?? lead.status}</td>
                <td className="px-3 py-2 text-xs text-muted">
                  {[lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" / ") || "—"}
                </td>
                <td className="px-3 py-2">
                  <form method="post" action={`/api/admin/leads/${lead.id}/delete`}>
                    <button className="text-xs font-semibold text-danger underline" title="Удаление по запросу человека. Отменить нельзя.">
                      Удалить
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">Показаны последние 200. В выгрузке CSV все лиды по фильтру.</p>

      <h2 className="mt-8 text-xl font-bold">Анкеты специалистов: {applications.length}</h2>
      <div className="card mt-3 overflow-x-auto !p-0">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-cream text-left text-muted">
            <tr>
              {["Дата", "Имя", "WhatsApp", "Уровень", "Обучение", "Практика, ч", "В неделю, ч"].map((h) => (
                <th key={h} className="px-3 py-2 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-muted">
                  Анкет пока нет
                </td>
              </tr>
            )}
            {applications.map((a) => (
              <tr key={a.id} className="border-t border-line align-top">
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">{dt(a.createdAt)}</td>
                <td className="px-3 py-2">{a.name}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">{a.whatsapp}</td>
                <td className="px-3 py-2">{t.specialists.form.levels[a.level] ?? a.level}</td>
                <td className="px-3 py-2">{a.education}</td>
                <td className="px-3 py-2">{a.practiceHours}</td>
                <td className="px-3 py-2">{a.weeklyHours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2">
        <a href="/api/admin/export?type=specialists" className="text-sm font-semibold underline">
          Выгрузить анкеты в CSV
        </a>
      </p>
    </main>
  );
}
