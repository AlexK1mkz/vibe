import { describe, expect, it } from 'vitest';
import type { Answers, Goal } from '../content/quiz';
import {
  FLOOR, GOAL_CAP, SCALE_IDS, START,
  bmi, bmiBand, computeScales, goalFor, massAt, score, zoneValues,
} from './scoring';

const healthy: Answers = {
  sex: 'f', age: '25-34', goal: 'check', energy: 'good', sleep: 'good',
  weight: 'stable', symptoms: ['none'], lastTests: 'year', format: 'explore',
};
const worst: Answers = {
  sex: 'f', age: '55+', goal: 'energy', energy: 'tired', sleep: 'insomnia', weight: 'plus8',
  symptoms: ['headache', 'hairskin', 'anxiety', 'libido', 'sugar', 'liver'],
  lastTests: 'unknown', format: 'program',
};

describe('computeScales', () => {
  it('без ответов все шкалы на старте', () => {
    const s = computeScales({});
    for (const id of SCALE_IDS) expect(s[id]).toBe(START);
  });

  it('лучшие ответы не отнимают баллы', () => {
    const r = score(healthy);
    for (const id of SCALE_IDS) expect(r.scales[id]).toBe(START);
    expect(r.index).toBe(START);
    expect(r.goalIndex).toBe(START);
  });

  it('худшие ответы не уходят ниже пола и остаются целыми', () => {
    const r = score(worst);
    for (const id of SCALE_IDS) {
      expect(r.scales[id]).toBeGreaterThanOrEqual(FLOOR);
      expect(r.scales[id]).toBeLessThan(START);
      expect(Number.isInteger(r.scales[id])).toBe(true);
    }
    expect(r.index).toBeLessThan(50);
  });

  it('ответ влияет на свою шкалу', () => {
    expect(computeScales({ energy: 'tired' }).energy).toBe(50);
    expect(computeScales({ sleep: 'unrested' }).sleep).toBe(60);
    expect(computeScales({ weight: 'plus8' }).weight).toBe(45);
    expect(computeScales({ symptoms: ['anxiety'] }).stress).toBe(58);
    expect(computeScales({ symptoms: ['hairskin'] }).skin).toBe(58);
  });
});

describe('рост и вес', () => {
  it('считает ИМТ и зону', () => {
    expect(bmi(165, 62)).toBe(22.8);
    expect(bmi(undefined, 62)).toBeNull();
    expect(bmiBand(18.4)).toBe('low');
    expect(bmiBand(18.5)).toBe('norm');
    expect(bmiBand(24.9)).toBe('norm');
    expect(bmiBand(25)).toBe('over');
    expect(bmiBand(30)).toBe('high');
    expect(bmiBand(35)).toBe('veryHigh');
  });
  it('норма веса зависит от роста', () => {
    expect(Math.round(massAt(18.5, 165))).toBe(50);
    expect(Math.round(massAt(25, 165))).toBe(68);
    expect(Math.round(massAt(25, 185))).toBe(86);
  });
  it('ИМТ в норме не отнимает баллы, выше нормы — снижает шкалу веса', () => {
    expect(computeScales({ height: 165, mass: 62 }).weight).toBe(START);
    const over = computeScales({ height: 165, mass: 75 }).weight;
    const high = computeScales({ height: 165, mass: 90 }).weight;
    expect(over).toBeLessThan(START);
    expect(high).toBeLessThan(over);
    expect(computeScales({ height: 180, mass: 52 }).energy).toBeLessThan(START);
  });
  it('ИМТ и прибавка веса складываются, но не ниже пола', () => {
    expect(computeScales({ height: 160, mass: 120, weight: 'plus8', symptoms: ['sugar'] }).weight).toBe(FLOOR);
  });
});

describe('goalFor', () => {
  it('считает цель по формуле min(90, c + (90 − c) × 0.8)', () => {
    expect(goalFor(50)).toBe(82);
    expect(goalFor(15)).toBe(75);
    expect(goalFor(60)).toBe(84);
  });
  it('сильные шкалы поддерживаем, цель не выше 90', () => {
    expect(goalFor(80)).toBe(80);
    expect(goalFor(85)).toBe(85);
    for (let c = FLOOR; c < 80; c++) {
      expect(goalFor(c)).toBeGreaterThan(c);
      expect(goalFor(c)).toBeLessThanOrEqual(GOAL_CAP);
    }
  });
});

describe('направление', () => {
  const dir = (a: Answers) => score({ ...healthy, ...a }).direction;

  it('цель из вопроса 3 задаёт направление', () => {
    expect(dir({ goal: 'weight' })).toBe('weight');
    expect(dir({ goal: 'energy' })).toBe('energy');
    expect(dir({ goal: 'hormones' })).toBe('hormones');
  });
  it('учитывает пол', () => {
    expect(dir({ goal: 'sexual', sex: 'm' })).toBe('mens');
    expect(dir({ goal: 'sexual', sex: 'f' })).toBe('ferritin');
    expect(dir({ goal: 'skin', sex: 'f' })).toBe('ferritin');
    expect(dir({ goal: 'skin', sex: 'm' })).toBe('hormones');
  });
  it('флаг «ферритин»: женщина, усталость и головные боли', () => {
    const r = score({ ...healthy, goal: 'energy', energy: 'tired', symptoms: ['headache'] });
    expect(r.flags.ferritin).toBe(true);
    expect(r.direction).toBe('ferritin');
    expect(score({ ...healthy, sex: 'm', goal: 'energy', energy: 'tired', symptoms: ['headache'] }).direction).toBe('energy');
  });
  it('«проверить себя» ведёт от признаков и слабой шкалы', () => {
    expect(dir({ symptoms: ['liver'] })).toBe('liver');
    expect(dir({ weight: 'plus8' })).toBe('weight');
    expect(dir({ sleep: 'insomnia' })).toBe('energy');
    expect(dir({ symptoms: ['libido'] })).toBe('hormones');
    expect(dir({})).toBe('energy');
  });
  it('все шесть направлений достижимы, чекап совпадает с направлением', () => {
    const seen = new Set<string>();
    const goals: Goal[] = ['weight', 'energy', 'hormones', 'skin', 'sexual', 'check'];
    for (const goal of goals)
      for (const sex of ['f', 'm'] as const)
        for (const symptoms of [['none'], ['liver'], ['headache']] as const) {
          const r = score({ ...healthy, goal, sex, energy: 'dip', symptoms: [...symptoms] });
          expect(r.checkup).toBe(r.direction);
          seen.add(r.direction);
        }
    expect([...seen].sort()).toEqual(['energy', 'ferritin', 'hormones', 'liver', 'mens', 'weight']);
  });
});

describe('сегментация', () => {
  const seg = (a: Answers) => score({ ...healthy, ...a }).segment;
  it('формат из вопроса 9', () => {
    expect(seg({ format: 'program' })).toBe('A');
    expect(seg({ format: 'course' })).toBe('B');
    expect(seg({ format: 'tests' })).toBe('C');
    expect(seg({ format: 'explore' })).toBe('D');
  });
  it('«пока изучаю» с задачей и без анализов — сегмент C', () => {
    expect(seg({ format: 'explore', goal: 'weight', lastTests: 'unknown' })).toBe('C');
    expect(seg({ format: 'explore', goal: 'weight', lastTests: 'year' })).toBe('D');
    expect(seg({ format: 'explore', goal: 'check', lastTests: 'unknown' })).toBe('D');
  });
});

describe('зоны внимания и модель', () => {
  it('от 2 до 4 зон, от слабой к сильной', () => {
    expect(score(healthy).attention).toHaveLength(2);
    const r = score(worst);
    expect(r.attention).toHaveLength(4);
    expect(r.scales[r.attention[0]]).toBeLessThanOrEqual(r.scales[r.attention[3]]);
  });
  it('у здоровых ответов зоны не подсвечены', () => {
    expect(zoneValues(score(healthy).scales)).toEqual({});
  });
  it('в режиме «цель» значения зон растут', () => {
    const r = score(worst);
    const now = zoneValues(r.scales, { t: 0, liver: r.flags.liver });
    const goal = zoneValues(r.scales, { t: 1, liver: r.flags.liver });
    expect(Object.keys(now).sort()).toEqual(['abdomen', 'chest', 'head', 'liver', 'pelvis', 'skin', 'thyroid']);
    for (const z of Object.keys(now) as (keyof typeof now)[]) expect(goal[z]!).toBeGreaterThan(now[z]!);
  });
});
