export interface ChartRow {
  key: string;
  label: string;
  /** Число ограничивающих ответов */
  value: number;
  max: number;
  /** Главное убеждение или главная сфера: столбец акцентного цвета */
  main?: boolean;
}

export interface ChartGroup {
  title: string;
  /** Пояснение к шкале группы, например «из 12» */
  note?: string;
  rows: ChartRow[];
}

interface Props {
  title: string;
  groups: ChartGroup[];
  /** Текст значения: подстановки {n} и {max} */
  valueLabel: string;
  /** Подпись главного столбца для скринридеров */
  mainLabel: string;
  /** Полное текстовое описание диаграммы для скринридеров */
  summary: string;
  className?: string;
}

/**
 * Диаграмма результата (ТЗ v2, п. 6.4.6): две группы горизонтальных столбцов,
 * три типа убеждений и три сферы. Подпись и значение стоят над столбцом,
 * поэтому читаются на экране 360 px. Цвета только из темы.
 */
export function ResultChart({ title, groups, valueLabel, mainLabel, summary, className }: Props) {
  const value = (row: ChartRow) => valueLabel.replace("{n}", String(row.value)).replace("{max}", String(row.max));
  return (
    <figure className={className} aria-label={title} data-testid="result-chart">
      <figcaption className="sr-only">{summary}</figcaption>
      <div className="grid gap-6 text-left sm:grid-cols-2 sm:gap-8" aria-hidden="true">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="eyebrow">{group.title}</p>
            {group.note && <p className="mt-1 text-xs text-muted">{group.note}</p>}
            <ul className="mt-3 grid gap-3">
              {group.rows.map((row) => {
                const percent = row.max > 0 ? Math.min(100, Math.round((row.value / row.max) * 100)) : 0;
                return (
                  <li key={row.key} data-main={row.main ? "true" : undefined} title={row.main ? mainLabel : undefined}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className={`text-[15px] leading-snug ${row.main ? "font-bold text-ink" : "font-medium text-muted"}`}>
                        {row.label}
                      </span>
                      <span className={`shrink-0 text-sm tabular-nums ${row.main ? "font-bold text-accent" : "text-muted"}`}>
                        {value(row)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          // Нулевой столбец оставляем видимой отметкой, чтобы строка не выглядела пустой
                          width: `${Math.max(percent, 2)}%`,
                          background: row.main ? "var(--accent)" : "var(--muted)",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </figure>
  );
}
