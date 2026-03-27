import { create } from "zustand";
import { setAuthToken } from "../api/api";

const MODE_KEY = "strumify_mode";
const USER_KEY = "strumify_user";
const TOKEN_KEY = "strumify_token";
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
    id: typeof stored.id === "string" ? stored.id : "",
    name: typeof stored.name === "string" ? stored.name : "",
    email: typeof stored.email === "string" ? stored.email : "",
    xp: Number.isFinite(stored.xp) ? stored.xp : 0,
    level: Number.isFinite(stored.level) ? stored.level : 1,
    rankTitle: typeof stored.rankTitle === "string" ? stored.rankTitle : ""
  };
};

const readToken = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
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
  token: readToken(),
  completedLessonIds: readCompleted(),
  dailyCompletions: readDailyCompletions(),
  lessonFeedback: readFeedback(),

  setMode: (mode) => {
    const next = safeMode(mode);
    if (!next) return;

    writeJson(MODE_KEY, next);
    set({ mode: next });
  },

  setUser: ({ id, name, email, xp = 0, level = 1, rankTitle = "" }) => {
    const user = {
      id: typeof id === "string" ? id.trim() : "",
      name: typeof name === "string" ? name.trim() : "",
      email: typeof email === "string" ? email.trim() : "",
      xp: Number.isFinite(xp) ? xp : 0,
      level: Number.isFinite(level) ? level : 1,
      rankTitle: typeof rankTitle === "string" ? rankTitle.trim() : ""
    };

    writeJson(USER_KEY, user);
    set({ user });
  },

  setToken: (token) => {
    const normalizedToken = typeof token === "string" ? token.trim() : "";
    setAuthToken(normalizedToken);
    set({ token: normalizedToken });
  },

  setSession: ({ user, token }) => {
    const normalizedUser = user && typeof user === "object" ? user : null;
    const normalizedToken = typeof token === "string" ? token.trim() : "";

    if (typeof window !== "undefined") {
      if (normalizedUser) {
        localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    }
    setAuthToken(normalizedToken);

    set({
      user: normalizedUser,
      token: normalizedToken
    });
  },

  logout: () => {
    writeJson(USER_KEY, null);
    writeJson(MODE_KEY, null);
    setAuthToken("");
    set({ user: null, mode: null, token: "" });
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
