import { expect, test, type Page } from '@playwright/test';

const answers = [
  'Женщина', '35–44', 'body', 'Вернуть энергию', 'Устаю уже с утра', 'Сплю, но не восстанавливаюсь',
  'Прибавилось 3–7 кг', ['Головные боли', 'Выпадение волос, сухая кожа'], 'Не помню',
  'Программа с личным сопровождением врача',
] as (string | string[])[];

async function passQuiz(page: Page) {
  const quiz = page.locator('#test');
  await quiz.scrollIntoViewIfNeeded();
  for (const answer of answers) {
    if (answer === 'body') {
      // вес +10 кг от стартового: ИМТ уходит выше нормы
      for (let i = 0; i < 10; i++) await quiz.getByRole('button', { name: 'Вес: больше' }).click();
      await expect(quiz.getByText(/ИМТ 26,4 · выше нормы/)).toBeVisible();
      await quiz.getByRole('button', { name: 'Далее' }).click();
    } else if (Array.isArray(answer)) {
      for (const a of answer) await quiz.getByRole('checkbox', { name: a }).click();
      await quiz.getByRole('button', { name: 'Далее' }).click();
    } else {
      await quiz.getByRole('radio', { name: answer, exact: true }).click();
    }
  }
}

/** Первый шаг теста — контакты. */
async function fillContact(page: Page) {
  const quiz = page.locator('#test');
  await quiz.scrollIntoViewIfNeeded();
  await quiz.getByLabel('Имя', { exact: true }).fill('Айгерим');
  await quiz.getByLabel('Фамилия').fill('Сапарова');
  await quiz.getByLabel('Телефон (WhatsApp)').fill('7011234567');
  await quiz.getByRole('checkbox').check();
  await quiz.getByRole('button', { name: 'Начать тест' }).click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('zr_cookie', 'necessary'));
  await page.route('**/api/lead.php', (route) => route.fulfill({ json: { ok: true } }));
});

test('тест: контакты → заявка сразу → вопросы → WhatsApp, дозапись ответов и результат на карте', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  // PHP в preview нет — подменяем ответ lead.php и проверяем, что ушло
  const leads: Record<string, any>[] = [];
  await page.route('**/api/lead.php', async (route) => {
    leads.push(route.request().postDataJSON());
    await route.fulfill({ json: { ok: true } });
  });
  await context.route('https://wa.me/**', (route) => route.fulfill({ body: 'wa' }));

  await page.goto('/');
  const quiz = page.locator('#test');
  await quiz.scrollIntoViewIfNeeded();
  // контакты — первый шаг, без них тест не начинается
  await expect(quiz.getByRole('heading', { name: 'Давайте познакомимся' })).toBeVisible();
  await quiz.getByRole('button', { name: 'Начать тест' }).click();
  await expect(quiz.getByText('Укажите фамилию')).toBeVisible();
  await fillContact(page);

  // заявка ушла сразу после контактов, ещё до вопросов
  await expect.poll(() => leads.length).toBe(1);
  expect(leads[0]).toMatchObject({ stage: 'contact', name: 'Айгерим', surname: 'Сапарова', phone: '+77011234567' });
  expect(leads[0].leadId).toMatch(/^ZR-[A-Z0-9]{6}$/);
  expect(leads[0].quiz).toBeUndefined();

  // последний ответ открывает WhatsApp и дописывает ответы в ту же заявку
  const popup = context.waitForEvent('page');
  await passQuiz(page);
  const wa = await popup;
  const waText = decodeURIComponent(wa.url().split('text=')[1]);
  expect(wa.url()).toContain('https://wa.me/');
  expect(waText).toContain('Меня зовут Айгерим Сапарова');

  await expect.poll(() => leads.length).toBe(2);
  expect(leads[1]).toMatchObject({ stage: 'done', leadId: leads[0].leadId, phone: '+77011234567' });
  expect(leads[1].quiz.bmi).toBe(26.4);
  expect(leads[1].quiz.segment).toBe('A');

  // результат и рекомендации на карте тела
  await expect(quiz.locator('[data-map-index]')).toContainText('Айгерим');
  await expect(quiz.locator('[data-map-reco]')).toContainText('Чекап «');
  await expect(quiz.locator('[data-body-mode] button').first()).toContainText(/\d/);

  const result = page.locator('[data-quiz-result]');
  await expect(result.getByRole('heading', { name: /Ваш индекс энергии — \d+ из 100/ })).toBeVisible();
  await expect(result.locator('[data-result-reco] li').first()).toContainText('Анализы:');

  const href = await result.locator('[data-result-cta]').getAttribute('href');
  const text = decodeURIComponent(href!.split('text=')[1]);
  expect(href).toContain('https://wa.me/');
  expect(text).toMatch(/Индекс энергии: \d+\/100/);
  expect(text).toContain('Цель: вернуть энергию');
  expect(text).toContain('Зоны внимания:');
  expect(text).toContain('Рекомендованный чекап: «');

  // переключатель «Сейчас ↔ Цель программы» меняет подписи на модели
  const spot = page.locator('#test [data-body-mode] button').first();
  const before = await spot.innerText();
  await result.getByRole('button', { name: 'Цель программы' }).click();
  await expect(page.locator('[data-mode-slider]')).toHaveValue('100');
  expect(await spot.innerText()).not.toBe(before);

  await expect(result).toContainText('это не диагноз');
  await expect(result).toContainText('Имеются противопоказания');
  expect(errors).toEqual([]);
});

test('фигура меняется по полу, зоны подсвечиваются по ответам', async ({ page }) => {
  await page.goto('/');
  const quiz = page.locator('#test');
  const body = quiz.locator('[data-body-mode]');
  await fillContact(page);
  await expect(body).toHaveAttribute('data-body-sex', 'f');
  await expect(quiz.locator('[data-zone-on="true"]')).toHaveCount(0);

  await quiz.getByRole('radio', { name: 'Мужчина' }).click();
  await expect(body).toHaveAttribute('data-body-sex', 'm');
  await expect(body.locator('img')).toHaveAttribute('src', /body-m/);
  await quiz.getByRole('radio', { name: '35–44' }).click();
  // рост и вес: фигура становится шире с весом
  const frame = body.locator('.body-frame');
  const before = (await frame.boundingBox())!.width;
  for (let i = 0; i < 15; i++) await quiz.getByRole('button', { name: 'Вес: больше' }).click();
  await expect.poll(async () => (await frame.boundingBox())!.width).toBeGreaterThan(before + 3);
  await quiz.getByRole('button', { name: 'Далее' }).click();
  await quiz.getByRole('radio', { name: 'Вернуть энергию' }).click();
  await quiz.getByRole('radio', { name: 'Устаю уже с утра' }).click();
  // после ответа про энергию зона груди остаётся подсвеченной и на следующем вопросе
  await expect(quiz.locator('[data-zone="chest"]')).toHaveAttribute('data-zone-on', 'true');
});

test('слайдер первого экрана листает фото клиники', async ({ page }) => {
  await page.goto('/');
  const slider = page.locator('[data-hero-slider]');
  const caption = slider.locator('[data-slide-caption]');
  await expect(caption).toHaveText('Ресепшен');
  await slider.getByRole('button', { name: 'Следующее фото' }).click();
  await expect(caption).toHaveText('Зона ожидания');
  await expect(slider.locator('[data-slide].is-active img')).toHaveAttribute('src', /corridor/);
  await slider.getByRole('button', { name: 'Предыдущее фото' }).click();
  await expect(caption).toHaveText('Ресепшен');
});

test('карточка «Узнаёте себя?» запускает тест с выбранной целью', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-quiz-goal="weight"]').click();
  const quiz = page.locator('#test');
  await fillContact(page);
  await quiz.getByRole('radio', { name: 'Мужчина' }).click();
  await quiz.getByRole('radio', { name: '25–34' }).click();
  await quiz.getByRole('button', { name: 'Пропустить' }).click();
  await expect(quiz.getByRole('radio', { name: 'Снизить вес' })).toHaveAttribute('aria-checked', 'true');
});

test('на странице нет цен', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).not.toContainText('₸');
});
