import { Navigate } from "react-router-dom";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ProgressBar } from "../components/ProgressBar";
import { useMode } from "../context/ModeContext";
import { modules } from "../data/modules";
import { Container } from "../layouts/Container";
import { useLearningStore } from "../store/useLearningStore";
import { getDailyStreak, getOverallProgress } from "../utils/learningPath";

const readPracticeSessions = () => {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem("strumify_practice_sessions");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const ProfilePage = () => {
  const { mode, setMode } = useMode();
  const user = useLearningStore((state) => state.user);
  const logout = useLearningStore((state) => state.logout);
  const completedLessonIds = useLearningStore((state) => state.completedLessonIds);
  const dailyCompletions = useLearningStore((state) => state.dailyCompletions);
  const resetProgress = useLearningStore((state) => state.resetProgress);

  if (!user) return <Navigate to="/login" replace />;

  const progress = getOverallProgress(modules, completedLessonIds);
  const streak = getDailyStreak(dailyCompletions);
  const sessions = readPracticeSessions();

  const averageAccuracy = sessions.length
    ? Math.round(sessions.reduce((sum, item) => sum + (item.accuracyPercent || 0), 0) / sessions.length)
    : 0;

  return (
    <Container className="space-y-8 py-20">
      <section>
        <p className="text-sm uppercase tracking-[0.18em] text-gray-400">Profile</p>
        <h1 className="mt-2 text-4xl font-bold text-white">{user.name || "Strumify User"}</h1>
        <p className="mt-2 text-sm text-gray-300">{user.email}</p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <Card mode={mode}>
          <p className="text-sm text-gray-400">Current mode</p>
          <p className="mt-2 text-2xl font-bold text-white">{mode === "kids" ? "Kids" : "Mature"}</p>
          <div className="mt-4 flex gap-2">
            <Button mode="mature" variant="secondary" className="px-3 py-2 text-xs" onClick={() => setMode("mature")}>
              Mature
            </Button>
            <Button mode="kids" variant="secondary" className="px-3 py-2 text-xs" onClick={() => setMode("kids")}>
              Kids
            </Button>
          </div>
        </Card>

        <Card mode={mode}>
          <p className="text-sm text-gray-400">Daily streak</p>
          <p className="mt-2 text-2xl font-bold text-white">{streak} day{streak === 1 ? "" : "s"}</p>
        </Card>

        <Card mode={mode}>
          <p className="text-sm text-gray-400">Practice accuracy</p>
          <p className="mt-2 text-2xl font-bold text-white">{averageAccuracy}%</p>
        </Card>
      </section>

      <Card mode={mode}>
        <h2 className="text-xl font-semibold text-white">Learning progress</h2>
        <div className="mt-4 max-w-xl">
          <ProgressBar mode={mode} label="Course progress" value={progress.completed} total={progress.total || 1} />
          <p className="mt-2 text-sm text-gray-300">
            {progress.completed}/{progress.total} lessons completed
          </p>
        </div>
      </Card>

      <section className="flex flex-wrap gap-3">
        <Button mode={mode} variant="secondary" onClick={resetProgress}>
          Reset Progress
        </Button>
        <Button mode={mode} variant="secondary" onClick={logout}>
          Logout
        </Button>
      </section>
    </Container>
  );
};
