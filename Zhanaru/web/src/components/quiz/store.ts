// Состояние теста. Ответы — сведения о здоровье: живут только в памяти вкладки,
// в браузере не сохраняются и уходят клинике только вместе с заявкой (ТЗ 9.8).
// Порядок: контакты → вопросы → результат. Контакты первыми, чтобы не терять лидов,
// которые бросили тест на середине: заявка уходит клинике сразу после этого шага.
import { create } from 'zustand';
import { questions, type Answers, type Goal, type QuestionId } from '../../content/quiz';

export interface Contact {
  firstName: string;
  lastName: string;
  phone: string;
  /** Номер заявки: по нему ответы теста дописываются в ту же строку таблицы. */
  leadId: string;
}

interface QuizState {
  answers: Answers;
  step: number;
  /** contact — имя и телефон, quiz — вопросы, result — результат. */
  phase: 'contact' | 'quiz' | 'result';
  contact: Contact | null;
  /** Положение слайдера: 0 — «сейчас», 1 — «цель программы». */
  t: number;
  setAnswer: (id: QuestionId, value: string | string[]) => void;
  setBody: (height: number | undefined, mass: number | undefined) => void;
  setContact: (contact: Contact) => void;
  next: () => void;
  back: () => void;
  startWithGoal: (goal: Goal) => void;
  restart: () => void;
  setT: (t: number) => void;
}

export const useQuiz = create<QuizState>((set) => ({
  answers: {},
  step: 0,
  phase: 'contact',
  contact: null,
  t: 0,
  setAnswer: (id, value) => set((s) => ({ answers: { ...s.answers, [id]: value } })),
  setBody: (height, mass) => set((s) => ({ answers: { ...s.answers, height, mass } })),
  setContact: (contact) => set({ contact, phase: 'quiz' }),
  next: () =>
    set((s) => (s.step >= questions.length - 1 ? { phase: 'result', t: 0 } : { step: s.step + 1 })),
  back: () =>
    set((s) => {
      if (s.phase === 'result') return { phase: 'quiz' };
      if (s.phase === 'quiz' && s.step === 0) return { phase: 'contact' };
      return { step: Math.max(0, s.step - 1) };
    }),
  // карточки «Узнаёте себя?»: цель предвыбрана, но без контактов тест не начинается
  startWithGoal: (goal) =>
    set((s) => ({ answers: { goal }, step: 0, phase: s.contact ? 'quiz' : 'contact', t: 0 })),
  restart: () => set((s) => ({ answers: {}, step: 0, phase: s.contact ? 'quiz' : 'contact', t: 0 })),
  setT: (t) => set({ t: Math.min(1, Math.max(0, t)) }),
}));
