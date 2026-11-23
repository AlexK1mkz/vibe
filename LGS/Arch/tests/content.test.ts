import { describe, expect, it } from "vitest";
import { ceilingName, countDrafts, results, sphereName, test as content, TOTAL_QUESTIONS } from "@/lib/content";
import messages from "@/content/funnel/messages.json";
import questionsJson from "@/content/test/questions.json";
import resultsJson from "@/content/test/results.json";

const BELIEFS = ["H", "B", "W"] as const;
const CEILINGS = ["H", "B", "W", "F"] as const;
const SPHERES = ["money", "relations", "growth"] as const;
const GOALS = ["price", "heard", "decide", "speak"] as const;
const COSTS = ["money", "time", "relations", "energy"] as const;

describe("контент теста", () => {
  const b = content.questions.filter((q) => q.block === "B");
  const values = (id: string) => content.questions.find((q) => q.id === id)!.options.map((o) => o.value);

  it("17 вопросов: 1 + 12 + 2 + 2, блок D в конце", () => {
    expect(TOTAL_QUESTIONS).toBe(17);
    expect(content.questions.map((q) => q.block).join("")).toBe("A" + "B".repeat(12) + "CC" + "DD");
  });

  it("верхние поля: типы, порядок при равенстве, сферы", () => {
    expect(content.version).toBe(2);
    expect(content.types).toEqual([...BELIEFS]);
    expect(content.tieOrder).toEqual(["B", "W", "H"]);
    expect(content.spheres).toEqual([...SPHERES]);
  });

  it("в каждом вопросе блока B четыре варианта с кодами H, B, W, R", () => {
    for (const q of b) {
      expect(q.options).toHaveLength(4);
      expect(q.options.map((o) => o.code).sort()).toEqual(["B", "H", "R", "W"]);
      for (const o of q.options) expect(o.id).toBe(`${q.id}_${o.code}`);
    }
  });

  it("по 4 вопроса на сферу, идентификаторы M1–M4, R1–R4, G1–G4", () => {
    const prefix = { money: "M", relations: "R", growth: "G" } as const;
    for (const sphere of SPHERES) {
      const ids = b.filter((q) => q.sphere === sphere).map((q) => q.id);
      expect(ids).toEqual([1, 2, 3, 4].map((n) => `${prefix[sphere]}${n}`));
    }
  });

  it("сферы в блоке B чередуются", () => {
    expect(b.map((q) => q.sphere)).toEqual([0, 1, 2, 3].flatMap(() => [...SPHERES]));
    expect(b.map((q) => q.id)).toEqual(["M1", "R1", "G1", "M2", "R2", "G2", "M3", "R3", "G3", "M4", "R4", "G4"]);
  });

  it("идентификаторы вопросов и вариантов уникальны, тексты не пустые", () => {
    const ids = content.questions.flatMap((q) => q.options.map((o) => o.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(content.questions.map((q) => q.id)).size).toBe(TOTAL_QUESTIONS);
    for (const q of content.questions) {
      expect(q.text.trim()).toBeTruthy();
      for (const o of q.options) expect(o.text.trim()).toBeTruthy();
    }
  });

  it("у вопросов A, C, D есть поле и значения, идентификатор варианта построен из значения", () => {
    for (const q of content.questions.filter((x) => x.block !== "B")) {
      expect(q.sets).toBeTruthy();
      for (const o of q.options) expect(o.id).toBe(`${q.id}_${o.value}`);
    }
  });

  it("значения вопросов совпадают с ключами интерпретаций и конфига", () => {
    expect(values("A1")).toEqual([...SPHERES]);
    expect(values("C1")).toEqual([...COSTS]);
    expect(values("C2")).toEqual([...GOALS]);
    expect(values("D1")).toEqual(["entrepreneur", "manager", "employee", "people", "nlp", "student"]);
    expect(values("D2")).toEqual(["lt250", "250_500", "500_1000", "1000_5000", "gte5000", "na"]);
  });

  it("у вопроса C2 необязательное поле на 200 знаков", () => {
    expect(content.questions.find((q) => q.id === "C2")!.freeText?.maxLength).toBe(200);
  });
});

describe("контент интерпретаций", () => {
  it("четыре результата с названиями и фразой убеждения", () => {
    expect(Object.keys(results.ceilings).sort()).toEqual([...CEILINGS].sort());
    expect(ceilingName("H")).toBe("Потолок обстоятельств");
    expect(ceilingName("B")).toBe("Потолок способностей");
    expect(ceilingName("W")).toBe("Потолок права");
    expect(ceilingName("F")).toBe("Свободный ход");
    for (const code of CEILINGS) expect(results.ceilings[code].voice).toMatch(/^«.+»$/);
  });

  it("у каждого результата все блоки: ядро, техника из 3 шагов, 3 сферы, 4 цели", () => {
    for (const code of CEILINGS) {
      const c = results.ceilings[code];
      expect(c.core.tagline.length).toBeGreaterThan(20);
      expect(c.core.sounds.length).toBeGreaterThan(100);
      expect(c.core.helped).toHaveLength(3);
      expect(c.technique.title).toBeTruthy();
      expect(c.technique.steps).toHaveLength(3);
      expect(Object.keys(c.inSphere).sort()).toEqual([...SPHERES].sort());
      expect(Object.keys(c.possible).sort()).toEqual([...GOALS].sort());
      for (const sphere of SPHERES) expect(c.inSphere[sphere].text.length).toBeGreaterThan(60);
      for (const goal of GOALS) {
        expect(c.possible[goal].items).toHaveLength(3);
        for (const item of c.possible[goal].items) expect(item.trim()).toBeTruthy();
      }
    }
  });

  it("цена, сферы и оговорка на месте", () => {
    expect(Object.keys(results.cost).sort()).toEqual([...COSTS].sort());
    for (const cost of COSTS) expect(results.cost[cost].text.length).toBeGreaterThan(20);
    expect(Object.keys(results.spheres).sort()).toEqual([...SPHERES].sort());
    for (const sphere of SPHERES) {
      expect(results.spheres[sphere].name).toBeTruthy();
      expect(results.spheres[sphere].in).toMatch(/^в /);
    }
    expect(sphereName("money")).toBe("Деньги и работа");
    expect(results.disclaimer.text).toContain("самооценка");
  });

  it("у каждого текстового блока есть статус draft или approved", () => {
    // 1 оговорка + 4 цены + 4 результата × (ядро + техника + 3 сферы + 4 цели)
    const { draft, total } = countDrafts();
    expect(total).toBe(1 + 4 + 4 * 9);
    expect(draft).toBeLessThanOrEqual(total);
    const statuses = JSON.stringify(resultsJson).match(/"status":"[^"]*"/g) ?? [];
    for (const status of statuses) expect(status).toMatch(/"(draft|approved)"$/);
  });

  it("образец из ТЗ для «Потолка права» в деньгах стоит дословно", () => {
    const w = results.ceilings.W;
    expect(w.core.sounds.startsWith("«Мне неловко просить столько». Вы умеете работать и приносите результат")).toBe(true);
    expect(w.core.helped).toEqual(["Вас считают скромным и надёжным человеком.", "С вами легко договориться.", "Вы не обещаете лишнего."]);
    expect(w.inSphere.money.text).toBe(
      "Вы называете цену ниже той, что планировали, и делаете это раньше, чем собеседник успел возразить. Он не знает, что вы уступили: он думает, что столько это и стоит. Так цена закрепляется на годы.",
    );
    expect(w.possible.price.items[0]).toBe("Вы называете цифру первой и выдерживаете паузу.");
    expect(w.technique.steps[2]).toBe("В разговоре назовите её и молчите, пока не ответит собеседник.");
  });
});

describe("запреты ТЗ в текстах теста и результата", () => {
  const all = JSON.stringify(questionsJson) + JSON.stringify(resultsJson) + JSON.stringify(messages);
  const visible = (JSON.stringify(questionsJson.questions) + JSON.stringify(resultsJson)).toLowerCase();

  it("слова «архетип» нет", () => {
    expect(all.toLowerCase()).not.toMatch(/архетип|archetype/);
  });

  it("нет здоровья, терапии, обещаний управлять другими и гарантий", () => {
    const banned =
      /болезн|исцел|лечени|лечит|фоби|паническ|депресс|аллерги|зависимост|похуд|терапи|гипноз|транс[^ф]|скрыт\S* управлен|подчинен|манипул|внушен|будут бояться|гарант|диагноз/;
    expect(visible).not.toMatch(banned);
  });

  it("нет восклицательных знаков и запрещённых слов, кавычки ёлочками", () => {
    expect(visible).not.toMatch(/!|уникальн|трансформаци|прокач|потенциал/);
    const texts = JSON.stringify(resultsJson).replace(/\\"/g, "'");
    expect(texts).not.toContain("'");
    expect(JSON.stringify(questionsJson.questions).replace(/\\"/g, "'")).not.toContain("'");
  });

  it("формулировки от первого лица в нейтральном роде", () => {
    const gendered = /не дорос|кто я такой|сам виноват|сама виновата|не готов отвечать|учился|училась|согласен\(|готов\(а\)/;
    expect(visible).not.toMatch(gendered);
  });
});

describe("цепочка сообщений", () => {
  it("в каждом сообщении есть способ отписаться", () => {
    for (const m of messages.messages) expect(m.text).toContain("{unsubscribeUrl}");
  });

  it("идентификаторы сообщений уникальны", () => {
    const ids = messages.messages.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("сегменты сообщений: только A, B и pro", () => {
    for (const m of messages.messages) {
      for (const segment of m.segments) expect(["A", "B", "pro"]).toContain(segment);
    }
  });
});
