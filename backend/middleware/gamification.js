export const LESSON_COMPLETION_XP = 50;
export const DAILY_STREAK_BONUS_XP = 20;
const XP_PER_LEVEL = 120;

const rankMilestones = [
  { level: 1, title: "Beginner" },
  { level: 3, title: "Rhythm Player" },
  { level: 5, title: "Chord Explorer" },
  { level: 8, title: "Strummer" },
  { level: 12, title: "Performer" }
];

const badgeMilestones = [
  { lessons: 1, badge: "First Lesson Complete" },
  { lessons: 5, badge: "Warmup Habit" },
  { lessons: 12, badge: "Module Finisher" },
  { lessons: 25, badge: "Stage Ready" },
  { streak: 3, badge: "3 Day Streak" },
  { streak: 7, badge: "7 Day Streak" },
  { streak: 14, badge: "14 Day Streak" }
];

const toDayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dayDiff = (fromDayKey, toDayKey) => {
  const from = new Date(`${fromDayKey}T00:00:00.000Z`);
  const to = new Date(`${toDayKey}T00:00:00.000Z`);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
};

export const getLevelFromXp = (xp = 0) => Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;

export const getRankTitle = (level = 1) => {
  let title = rankMilestones[0].title;
  for (const milestone of rankMilestones) {
    if (level >= milestone.level) {
      title = milestone.title;
    }
  }
  return title;
};

export const getXpMeta = (xp = 0) => {
  const level = getLevelFromXp(xp);
  const currentLevelFloor = (level - 1) * XP_PER_LEVEL;
  const nextLevelTarget = level * XP_PER_LEVEL;

  return {
    level,
    xpInCurrentLevel: xp - currentLevelFloor,
    xpRequiredForNextLevel: nextLevelTarget - currentLevelFloor,
    nextLevelTarget
  };
};

const applyBadges = (user) => {
  const badges = new Set(user.badges || []);
  const completed = user.completedLessons.length;

  for (const milestone of badgeMilestones) {
    if (milestone.lessons && completed >= milestone.lessons) {
      badges.add(milestone.badge);
    }
    if (milestone.streak && user.streak >= milestone.streak) {
      badges.add(milestone.badge);
    }
  }

  user.badges = [...badges];
};

export const buildProfilePayload = (user, totalLessons) => {
  const completedCount = user.completedLessons.length;
  const progressPercent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;
  const xpMeta = getXpMeta(user.xp);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    xp: user.xp,
    level: user.level,
    rankTitle: user.rankTitle,
    completedLessons: completedCount,
    badges: user.badges,
    totalPracticeMinutes: user.totalPracticeMinutes,
    todayPracticeMinutes: user.todayPracticeMinutes,
    streak: user.streak,
    practiceHistory: user.practiceHistory,
    totalLessons,
    progressPercent,
    ...xpMeta
  };
};

export const completeLessonForUser = async (user, lesson, practiceMinutesInput = 0) => {
  const lessonId = String(lesson._id);
  const completedSet = new Set(user.completedLessons.map((id) => String(id)));

  if (completedSet.has(lessonId)) {
    return {
      alreadyCompleted: true,
      xpEarned: 0,
      streakBonusXp: 0,
      levelUp: false
    };
  }

  const today = toDayKey();
  const lessonMinutes = Number(lesson.duration) || 0;
  const extraPracticeMinutes = Math.max(0, Number(practiceMinutesInput) || 0);
  const creditedMinutes = lessonMinutes + extraPracticeMinutes;

  let streakBonusXp = 0;

  if (!user.lastPracticeDate) {
    user.streak = 1;
    user.todayPracticeMinutes = 0;
    streakBonusXp = DAILY_STREAK_BONUS_XP;
  } else {
    const delta = dayDiff(user.lastPracticeDate, today);

    if (delta === 0) {
      // Same day; no streak bonus.
    } else if (delta === 1) {
      user.streak += 1;
      user.todayPracticeMinutes = 0;
      streakBonusXp = DAILY_STREAK_BONUS_XP;
    } else {
      user.streak = 1;
      user.todayPracticeMinutes = 0;
      streakBonusXp = DAILY_STREAK_BONUS_XP;
    }
  }

  user.completedLessons.push(lesson._id);

  const previousLevel = user.level;

  const baseXp = Number(lesson.xpReward) || LESSON_COMPLETION_XP;
  const xpEarned = baseXp + streakBonusXp;
  user.xp += xpEarned;

  const xpMeta = getXpMeta(user.xp);
  user.level = xpMeta.level;
  user.rankTitle = getRankTitle(user.level);

  user.totalPracticeMinutes += creditedMinutes;
  user.todayPracticeMinutes += creditedMinutes;
  user.lastPracticeDate = today;

  const historyIndex = user.practiceHistory.findIndex((entry) => entry.date === today);
  if (historyIndex === -1) {
    user.practiceHistory.push({
      date: today,
      minutes: creditedMinutes,
      lessonsCompleted: 1,
      xpEarned
    });
  } else {
    user.practiceHistory[historyIndex].minutes += creditedMinutes;
    user.practiceHistory[historyIndex].lessonsCompleted += 1;
    user.practiceHistory[historyIndex].xpEarned += xpEarned;
  }

  applyBadges(user);
  await user.save();

  return {
    alreadyCompleted: false,
    xpEarned,
    streakBonusXp,
    levelUp: user.level > previousLevel
  };
};
