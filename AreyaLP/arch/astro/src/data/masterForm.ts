export type FieldType = 'text' | 'area' | 'choice';

export interface FormField {
  k: string;
  t: string;
  type: FieldType;
  ph?: string;
  opts?: string[];
}

/** Шаги анкеты на Master */
export const MASTER_FORM_FIELDS: FormField[] = [
  { k: 'name', t: 'Имя и фамилия', type: 'text', ph: 'Как к тебе обращаться' },
  { k: 'contact', t: 'Telegram или телефон', type: 'text', ph: '@username или +7…' },
  { k: 'work', t: 'Чем ты занимаешься? Ссылка на проект / соцсети', type: 'area', ph: 'Коротко о проекте и ссылка' },
  { k: 'income', t: 'Текущий доход в месяц', type: 'choice', opts: ['до 300 тыс ₽', '300–500 тыс ₽', '500 тыс – 1 млн ₽', '1 млн+ ₽'] },
  { k: 'goal', t: 'Какой доход планируешь через 3 месяца?', type: 'text', ph: 'Сумма в месяц' },
  { k: 'block', t: 'Что мешает прийти к нему сейчас?', type: 'area', ph: 'Свободный текст' },
  { k: 'why', t: 'Почему именно сейчас и почему Master?', type: 'area', ph: 'Свободный текст' },
  { k: 'ready', t: 'Готовность к инвестиции 300 000 ₽ до 10 октября', type: 'choice', opts: ['Да', 'Нужна рассрочка', 'Обсудить'] },
];
