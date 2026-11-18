import { expect, test, type Page } from "@playwright/test";

/** Сквозной путь: лендинг → тест → контакт → результат (ТЗ, п. 12) */

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
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Почему в важном разговоре");
  await page.getByRole("button", { name: "Только необходимые" }).click();
  await page.getByRole("link", { name: "Пройти тест" }).first().click();
  await expect(page).toHaveURL(/\/test$/);

  await answerAll(page, {
    A1: "A1_money",
    B1: "B1_N", B2: "B2_D", B3: "B3_D", B4: "B4_D", B5: "B5_S", B6: "B6_D",
    B7: "B7_D", B8: "B8_S", B9: "B9_D", B10: "B10_D", B11: "B11_S", B12: "B12_D",
    C1: "C1_money", C2: "C2_price", D1: "D1_manager", D2: "D2_500_1000",
  });

  // Короткий результат показан до формы контакта
  await expect(page).toHaveURL(/\/result\/[a-z0-9]+$/, { timeout: 15_000 });
  await expect(page.getByTestId("archetype-title")).toHaveText("Ваш архетип: Дипломат");
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
  await expect(page.getByRole("heading", { name: /Слепая зона в вашей ситуации/ })).toBeVisible();
  await expect(page.getByText("Вы написали:")).toContainText("Поднять цену");
  await expect(page.locator("[data-segment]")).toHaveAttribute("data-segment", "A");
  await expect(page.getByRole("link", { name: /Разобрать мою ситуацию с мастером, 2 000 ₸/ })).toBeVisible();
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

test("сегмент specialist видит кнопку «Работать в институте», сегмент B только интенсив", async ({ request, page }) => {
  const base = {
    B1: "B1_N", B2: "B2_S", B3: "B3_N", B4: "B4_O", B5: "B5_N", B6: "B6_S",
    B7: "B7_N", B8: "B8_S", B9: "B9_S", B10: "B10_N", B11: "B11_S", B12: "B12_S",
    C1: "C1_time",
  };
  const cases = [
    { answers: { ...base, A1: "A1_profession", C2: "C2_profession", D1: "D1_people", D2: "D2_gte1000" }, segment: "specialist" },
    { answers: { ...base, A1: "A1_team", C2: "C2_heard", D1: "D1_employee", D2: "D2_na" }, segment: "B" },
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
    await expect(page.locator("[data-segment]")).toHaveAttribute("data-segment", item.segment);
    await expect(page.getByRole("link", { name: "Работать в институте" })).toHaveCount(item.segment === "specialist" ? 1 : 0);
    await expect(page.getByRole("link", { name: /Пять вечеров с Саидой, 10 000 ₸/ })).toHaveCount(item.segment === "B" ? 1 : 0);
  }
});

test("анкета специалиста сохраняется", async ({ page }) => {
  await page.goto("/specialists");
  await page.locator("#sp-name").fill("Тестовый специалист");
  await page.locator("#sp-whatsapp").pressSequentially("7001112233");
  await page.getByText("Мастер", { exact: true }).click();
  await page.locator("#sp-education").fill("Тестовая школа, 2020");
  await page.locator("#sp-practiceHours").fill("200");
  await page.locator("#sp-weeklyHours").fill("10");
  await page.locator("#sp-consent").check();
  await page.getByRole("button", { name: "Отправить анкету" }).click();
  await expect(page).toHaveURL(/\/thanks\?type=specialist/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Анкета получена");
});
