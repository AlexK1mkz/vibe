import { expect, test, type Page } from "@playwright/test";

/** Сквозной путь: лендинг → тест «Стеклянный потолок» → контакт → результат (ТЗ v2, раздел 10) */

async function answerAll(page: Page, pick: Record<string, string>) {
  for (let n = 1; n <= 17; n++) {
    await expect(page.getByTestId("progress")).toHaveText(`${n} из 17`);
    const options = page.locator("[data-option]");
    const first = await options.first().getAttribute("data-option");
    const questionId = first!.split("_")[0];
    const wanted = pick[questionId];
    const target = wanted ? page.locator(`[data-option="${wanted}"]`) : options.first();
    await target.click();
    if (questionId === "C2") {
      await page.getByLabel("Своими словами, если хотите").fill("Поднять цену и не потерять клиентов");
      await page.getByRole("button", { name: "Дальше" }).click();
    }
  }
}

test("лендинг → тест → контакт → полный результат, сегмент A", async ({ page }) => {
  await page.goto("/?utm_source=e2e&utm_campaign=funnel");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Станьте НЛП-практиком за 3 месяца");
  await page.getByRole("button", { name: "Только необходимые" }).click();
  await page.getByRole("link", { name: "Пройти тест" }).first().click();
  await expect(page).toHaveURL(/\/test$/);

  await answerAll(page, {
    A1: "A1_money",
    M1: "M1_W", M2: "M2_W", M3: "M3_W", M4: "M4_H",
    R1: "R1_R", R2: "R2_W", R3: "R3_R", R4: "R4_R",
    G1: "G1_R", G2: "G2_B", G3: "G3_R", G4: "G4_R",
    C1: "C1_money", C2: "C2_price", D1: "D1_manager", D2: "D2_500_1000",
  });

  // Короткий результат показан до формы контакта
  await expect(page).toHaveURL(/\/result\/[a-z0-9]+$/, { timeout: 15_000 });
  await expect(page.getByTestId("short-result")).toBeVisible();
  await expect(page.getByTestId("ceiling-title")).toHaveText("Ваш потолок: Потолок права");
  await expect(page.getByTestId("ceiling-sphere")).toHaveText("Сильнее всего он в сфере: Деньги и работа");
  await expect(page.getByTestId("short-result")).toContainText("«Я не заслуживаю, не имею права»");
  await expect(page.getByTestId("result-chart")).toBeVisible();
  await expect(page.getByTestId("full-result")).toHaveCount(0);

  // Пустая форма не отправляется, согласие не предустановлено
  await expect(page.locator("#contact-consent")).not.toBeChecked();
  await page.getByRole("button", { name: "Получить полный разбор" }).click();
  await expect(page.getByText("Без согласия мы не можем сохранить ваш контакт")).toBeVisible();

  await page.locator("#contact-name").fill("Тестовый");
  await page.locator("#contact-whatsapp").pressSequentially("7001234567");
  await expect(page.locator("#contact-whatsapp")).toHaveValue("+7 (700) 123-45-67");
  await page.locator("#contact-consent").check();
  await page.getByRole("button", { name: "Получить полный разбор" }).click();

  await expect(page.getByTestId("full-result")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Как оно работает в деньгах/ })).toBeVisible();
  await expect(page.getByText("Вы написали:")).toContainText("Поднять цену");
  await expect(page.locator("[data-segment]")).toHaveAttribute("data-segment", "A");
  await expect(page.getByRole("link", { name: /Разобрать моё убеждение с мастером, 40 минут, 2 000 ₸/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Интенсив «Структура человека», 14–18 декабря/ })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/архетип/i);
});

test("незавершённый тест продолжается с места остановки", async ({ page }) => {
  await page.goto("/test");
  await page.locator("[data-option]").first().click();
  await expect(page.getByTestId("progress")).toHaveText("2 из 17");
  await page.locator("[data-option]").first().click();
  await expect(page.getByTestId("progress")).toHaveText("3 из 17");
  await page.reload();
  await expect(page.getByTestId("progress")).toHaveText("3 из 17");
  await expect(page.getByText("Продолжаем с места, где вы остановились.")).toBeVisible();
  await page.getByRole("button", { name: "Назад" }).click();
  await expect(page.getByTestId("progress")).toHaveText("2 из 17");
});

test("сегмент pro видит кнопку «Работать в институте», сегмент B только интенсив, 10 ресурсных ответов дают «Свободный ход»", async ({ request, page }) => {
  const base = {
    M1: "M1_R", M2: "M2_R", M3: "M3_R", M4: "M4_R",
    R1: "R1_B", R2: "R2_R", R3: "R3_R", R4: "R4_R",
    G1: "G1_R", G2: "G2_R", G3: "G3_R", G4: "G4_R",
    C1: "C1_time",
  };
  const cases = [
    { answers: { ...base, A1: "A1_growth", C2: "C2_speak", D1: "D1_nlp", D2: "D2_gte5000" }, segment: "pro", title: "Ваш результат: Свободный ход" },
    { answers: { ...base, R2: "R2_B", R3: "R3_B", A1: "A1_relations", C2: "C2_heard", D1: "D1_employee", D2: "D2_na" }, segment: "B", title: "Ваш потолок: Потолок способностей" },
  ];
  for (const [i, item] of cases.entries()) {
    const created = await request.post("/api/leads", { data: { answers: item.answers } });
    expect(created.ok()).toBeTruthy();
    const { publicId } = await created.json();
    const contact = await request.post(`/api/leads/${publicId}/contact`, {
      data: { name: "Тест", whatsapp: `+7700000000${i}`, consent: true },
    });
    expect(contact.ok()).toBeTruthy();
    await page.goto(`/result/${publicId}`);
    await expect(page.getByTestId("ceiling-title")).toHaveText(item.title);
    await expect(page.locator("[data-segment]")).toHaveAttribute("data-segment", item.segment);
    await expect(page.getByRole("link", { name: "Работать в институте" })).toHaveCount(item.segment === "pro" ? 1 : 0);
    await expect(page.getByRole("link", { name: /Пять вечеров с Саидой, 10 000 ₸/ })).toHaveCount(item.segment === "B" ? 1 : 0);
  }
});

test("анкета специалиста сохраняется", async ({ page }) => {
  await page.goto("/specialists");
  await page.locator("#sp-name").fill("Тестовый специалист");
  await page.locator("#sp-whatsapp").pressSequentially("7001112233");
  await expect(page.locator("#sp-whatsapp")).toHaveValue("+7 (700) 111-22-33");
  await page.locator("#sp-city").fill("Алматы, UTC+5");
  await page.locator("#form").getByText("Тренер", { exact: true }).click();
  await page.locator("#sp-education").fill("Тестовая школа, 2020");
  await page.locator("#sp-certificate").fill("Тестовая школа");
  await page.locator("#sp-practiceHours").fill("200");
  await page.locator("#sp-weeklyHours").fill("10");
  await page.locator("#sp-profileUrl").fill("instagram.com/test_specialist");

  // Согласие не предустановлено, без него и без ответа «зачем» анкета не уходит
  await expect(page.locator("#sp-consent")).not.toBeChecked();
  await page.getByRole("button", { name: "Отправить анкету" }).click();
  await expect(page.locator("#sp-motivation-error")).toBeVisible();
  await expect(page.locator("#sp-consent-error")).toBeVisible();
  await expect(page).toHaveURL(/\/specialists/);

  await page.locator("#sp-motivation").fill("Хочу практику с клиентами и обратную связь от старшего");
  await expect(page.locator("#sp-motivation-counter")).toHaveText("54 из 300");
  await page.locator("#sp-consent").check();
  await page.getByRole("button", { name: "Отправить анкету" }).click();
  await expect(page).toHaveURL(/\/thanks\?type=specialist/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Анкета получена");
  await expect(page.getByRole("heading", { name: "Что будет дальше" })).toBeVisible();
});
