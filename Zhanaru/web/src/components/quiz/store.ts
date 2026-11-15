// Состояние теста. Ответы — сведения о здоровье: живут только в памяти вкладки,
// в браузере не сохраняются и уходят клинике только вместе с заявкой (ТЗ 9.8).
import { create } from 'zustand';
import { questions, type Answers, type Goal, type QuestionId } from '../../content/quiz';

export interface Contact {
  firstName: string;
  lastName: string;
  phone: string;
}

interface QuizState {
  answers: Answers;
  step: number;
  /** quiz — вопросы, contact — имя и телефон, result — результат. */
  phase: 'quiz' | 'contact' | 'result';
  contact: Contact | null;
  /** Положение слайдера: 0 — «сейчас», 1 — «цель программы». */
  t: number;
  setAnswer: (id: QuestionId, value: string | string[]) => void;
  setBody: (height: number | undefined, mass: number | undefined) => void;
  next: () => void;
  back: () => void;
  finish: (contact: Contact) => void;
  startWithGoal: (goal: Goal) => void;
  restart: () => void;
  setT: (t: number) => void;
}

export const useQuiz = create<QuizState>((set) => ({
  answers: {},
  step: 0,
  phase: 'quiz',
  contact: null,
  t: 0,
  setAnswer: (id, value) => set((s) => ({ answers: { ...s.answers, [id]: value } })),
  setBody: (height, mass) => set((s) => ({ answers: { ...s.answers, height, mass } })),
  next: () =>
    set((s) => (s.step >= questions.length - 1 ? { phase: 'contact' } : { step: s.step + 1 })),
  back: () =>
    set((s) => (s.phase !== 'quiz' ? { phase: 'quiz' } : { step: Math.max(0, s.step - 1) })),
  finish: (contact) => set({ contact, phase: 'result', t: 0 }),
  startWithGoal: (goal) => set({ answers: { goal }, step: 0, phase: 'quiz', t: 0 }),
  restart: () => set({ answers: {}, step: 0, phase: 'quiz', t: 0 }),
  setT: (t) => set({ t: Math.min(1, Math.max(0, t)) }),
}));
