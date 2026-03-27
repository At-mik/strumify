const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const formatDateLabel = (date = new Date()) =>
  date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

export const getModuleProgress = (moduleDoc, completedLessonIds = []) => {
  const lessons = Array.isArray(moduleDoc?.lessons) ? moduleDoc.lessons : [];
  const total = lessons.length;

  if (total === 0) {
    return { total: 0, completed: 0, percent: 0 };
  }

  const completedSet = new Set(Array.isArray(completedLessonIds) ? completedLessonIds : []);
  const completed = lessons.filter((lesson) => completedSet.has(lesson.id)).length;

  return {
    total,
    completed,
    percent: Math.round((completed / total) * 100)
  };
};

export const getOverallProgress = (modules = [], completedLessonIds = []) => {
  const safeModules = Array.isArray(modules) ? modules : [];
  const completedSet = new Set(Array.isArray(completedLessonIds) ? completedLessonIds : []);

  const allLessons = safeModules.flatMap((moduleDoc) => (Array.isArray(moduleDoc?.lessons) ? moduleDoc.lessons : []));

  const total = allLessons.length;
  if (total === 0) {
    return { total: 0, completed: 0, percent: 0 };
  }

  const completed = allLessons.filter((lesson) => completedSet.has(lesson.id)).length;

  return {
    total,
    completed,
    percent: Math.round((completed / total) * 100)
  };
};

export const getKidsXp = (modules = [], completedLessonIds = []) => {
  const safeModules = Array.isArray(modules) ? modules : [];
  const completedSet = new Set(Array.isArray(completedLessonIds) ? completedLessonIds : []);

  return safeModules.reduce((sum, moduleDoc) => {
    const lessons = Array.isArray(moduleDoc?.lessons) ? moduleDoc.lessons : [];

    return (
      sum +
      lessons.reduce((lessonSum, lesson) => {
        if (!completedSet.has(lesson.id)) return lessonSum;

        const xp = Number.isFinite(lesson.xpReward) ? lesson.xpReward : 0;
        return lessonSum + xp;
      }, 0)
    );
  }, 0);
};

export const getDailyStats = (modules = [], completedLessonIds = [], dailyCompletions = {}) => {
  const progress = getOverallProgress(modules, completedLessonIds);
  const streak = getDailyStreak(dailyCompletions);

  return {
    streak,
    completedLessons: progress.completed,
    progressPercent: progress.percent
  };
};

export const getDailyStreak = (dailyCompletions = {}) => {
  const safeDaily = dailyCompletions && typeof dailyCompletions === "object" ? dailyCompletions : {};

  let streak = 0;
  const today = startOfDay(new Date());

  while (true) {
    const key = toDateKey(today);
    const completedToday = Array.isArray(safeDaily[key]) ? safeDaily[key] : [];

    if (completedToday.length === 0) {
      break;
    }

    streak += 1;
    today.setDate(today.getDate() - 1);
  }

  return streak;
};

export const getCalendarGrid = (dailyCompletions = {}, referenceDate = new Date()) => {
  const safeDaily = dailyCompletions && typeof dailyCompletions === "object" ? dailyCompletions : {};
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ id: `empty-${i}`, empty: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const key = toDateKey(date);
    const lessons = Array.isArray(safeDaily[key]) ? safeDaily[key] : [];

    cells.push({
      id: key,
      day,
      dateKey: key,
      completedCount: lessons.length,
      completed: lessons.length > 0,
      isToday: toDateKey(new Date()) === key
    });
  }

  return {
    monthLabel: referenceDate.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    cells
  };
};

export const findModuleBySlug = (modules = [], moduleSlug = "") =>
  (Array.isArray(modules) ? modules : []).find((moduleDoc) => moduleDoc?.slug === moduleSlug) || null;

export const findLessonBySlug = (moduleDoc, lessonSlug = "") => {
  const lessons = Array.isArray(moduleDoc?.lessons) ? moduleDoc.lessons : [];
  return lessons.find((lesson) => lesson?.slug === lessonSlug) || null;
};

export const getNextLesson = (moduleDoc, lessonSlug = "") => {
  const lessons = Array.isArray(moduleDoc?.lessons) ? moduleDoc.lessons : [];
  const currentIndex = lessons.findIndex((lesson) => lesson?.slug === lessonSlug);

  if (currentIndex < 0) return null;
  return lessons[currentIndex + 1] || null;
};

export const isLessonUnlocked = (moduleDoc, lessonIndex, completedLessonIds = []) => {
  if (lessonIndex <= 0) return true;

  const lessons = Array.isArray(moduleDoc?.lessons) ? moduleDoc.lessons : [];
  const previousLesson = lessons[lessonIndex - 1];

  if (!previousLesson?.id) return false;

  const completedSet = new Set(Array.isArray(completedLessonIds) ? completedLessonIds : []);
  return completedSet.has(previousLesson.id);
};
