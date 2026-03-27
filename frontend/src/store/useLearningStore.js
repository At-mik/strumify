import { create } from "zustand";

const MODE_KEY = "strumify_mode";
const USER_KEY = "strumify_user";
const COMPLETED_KEY = "strumify_completed_lessons";
const DAILY_KEY = "strumify_daily_completions";
const FEEDBACK_KEY = "strumify_lesson_feedback";

const readJson = (key, fallback) => {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to persist ${key}`, error);
  }
};

const toDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const safeMode = (value) => (value === "mature" || value === "kids" ? value : null);

const readMode = () => safeMode(readJson(MODE_KEY, null));

const readUser = () => {
  const stored = readJson(USER_KEY, null);
  if (!stored || typeof stored !== "object") return null;

  return {
    name: typeof stored.name === "string" ? stored.name : "",
    email: typeof stored.email === "string" ? stored.email : ""
  };
};

const readCompleted = () => {
  const stored = readJson(COMPLETED_KEY, []);
  return Array.isArray(stored) ? stored : [];
};

const readDailyCompletions = () => {
  const stored = readJson(DAILY_KEY, {});
  if (!stored || typeof stored !== "object") return {};

  return Object.entries(stored).reduce((acc, [key, value]) => {
    acc[key] = Array.isArray(value) ? value : [];
    return acc;
  }, {});
};

const readFeedback = () => {
  const stored = readJson(FEEDBACK_KEY, {});
  if (!stored || typeof stored !== "object") return {};

  return stored;
};

export const useLearningStore = create((set, get) => ({
  mode: readMode(),
  user: readUser(),
  completedLessonIds: readCompleted(),
  dailyCompletions: readDailyCompletions(),
  lessonFeedback: readFeedback(),

  setMode: (mode) => {
    const next = safeMode(mode);
    if (!next) return;

    writeJson(MODE_KEY, next);
    set({ mode: next });
  },

  setUser: ({ name, email }) => {
    const user = {
      name: typeof name === "string" ? name.trim() : "",
      email: typeof email === "string" ? email.trim() : ""
    };

    writeJson(USER_KEY, user);
    set({ user });
  },

  logout: () => {
    writeJson(USER_KEY, null);
    writeJson(MODE_KEY, null);
    set({ user: null, mode: null });
  },

  completeLesson: ({ lessonId, feedback, durationSeconds = 0 }) => {
    if (!lessonId) return;

    const state = get();

    const completedLessonIds = Array.isArray(state.completedLessonIds) ? state.completedLessonIds : [];
    const nextCompleted = completedLessonIds.includes(lessonId) ? completedLessonIds : [...completedLessonIds, lessonId];

    const todayKey = toDateKey();
    const dailyCompletions = state.dailyCompletions && typeof state.dailyCompletions === "object" ? state.dailyCompletions : {};
    const todayLessons = Array.isArray(dailyCompletions[todayKey]) ? dailyCompletions[todayKey] : [];

    const nextDaily = {
      ...dailyCompletions,
      [todayKey]: todayLessons.includes(lessonId) ? todayLessons : [...todayLessons, lessonId]
    };

    const lessonFeedback = state.lessonFeedback && typeof state.lessonFeedback === "object" ? state.lessonFeedback : {};
    const feedbackEntry = {
      clarity: feedback?.clarity || "",
      struggle: feedback?.struggle || "",
      durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
      submittedAt: new Date().toISOString(),
      mode: state.mode || "mature"
    };

    const nextFeedback = {
      ...lessonFeedback,
      [lessonId]: feedbackEntry
    };

    writeJson(COMPLETED_KEY, nextCompleted);
    writeJson(DAILY_KEY, nextDaily);
    writeJson(FEEDBACK_KEY, nextFeedback);

    set({
      completedLessonIds: nextCompleted,
      dailyCompletions: nextDaily,
      lessonFeedback: nextFeedback
    });
  },

  resetProgress: () => {
    writeJson(COMPLETED_KEY, []);
    writeJson(DAILY_KEY, {});
    writeJson(FEEDBACK_KEY, {});

    set({
      completedLessonIds: [],
      dailyCompletions: {},
      lessonFeedback: {}
    });
  }
}));
