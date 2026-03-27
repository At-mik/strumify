import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import { ProgressBar } from "../components/ProgressBar";
import { useMode } from "../context/ModeContext";
import { allLessons, modules } from "../data/modules";
import { Container } from "../layouts/Container";
import { useLearningStore } from "../store/useLearningStore";
import { isLessonUnlocked } from "../utils/learningPath";

const lessonSectionsForMode = (lesson, mode) => {
  if (!lesson) return [];

  if (mode === "kids") {
    const steps = Array.isArray(lesson?.kids?.steps) ? lesson.kids.steps : [];

    return [
      { id: "warm-up", title: "Warm-up", content: lesson?.kids?.story || "" },
      { id: "concept", title: "Concept", content: steps[0] || "" },
      { id: "practice", title: "Practice", content: steps.slice(1, 3).join(" ").trim() },
      { id: "challenge", title: "Challenge", content: steps[3] || steps[2] || "" },
      { id: "ending", title: "Ending", content: lesson?.kids?.reward || "" }
    ];
  }

  return [
    { id: "warm-up", title: "Warm-up", content: lesson?.mature?.warmUp || "" },
    { id: "concept", title: "Concept", content: lesson?.mature?.coreLearning || "" },
    { id: "practice", title: "Practice", content: lesson?.mature?.practice || "" },
    { id: "challenge", title: "Challenge", content: lesson?.mature?.challenge || "" },
    { id: "ending", title: "Ending", content: lesson?.mature?.ending || "" }
  ];
};

export const LearnPage = () => {
  const user = useLearningStore((state) => state.user);
  const completedLessonIds = useLearningStore((state) => state.completedLessonIds);
  const completeLesson = useLearningStore((state) => state.completeLesson);
  const { mode } = useMode();

  const [activeLessonId, setActiveLessonId] = useState(() => allLessons[0]?.id || "");

  if (!user) return <Navigate to="/login" replace />;

  const completedSet = new Set(completedLessonIds);
  const progressPercent = Math.round((completedSet.size / Math.max(1, allLessons.length)) * 100);

  const activeLesson = useMemo(() => allLessons.find((lesson) => lesson.id === activeLessonId) || allLessons[0] || null, [activeLessonId]);
  const activeSections = lessonSectionsForMode(activeLesson, mode).filter((item) => Boolean(item.content));
  const activeInstagramUrl = typeof activeLesson?.instagramUrl === "string" ? activeLesson.instagramUrl.trim() : "";

  return (
    <Container className="space-y-8 py-20">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.18em] text-gray-400">Learn</p>
        <h1 className="text-4xl font-bold text-white">Learn Guitar Step by Step</h1>
        <p className="max-w-3xl text-gray-300">Follow focused lessons designed to build real playing confidence, one session at a time.</p>

        <div className="max-w-xl">
          <ProgressBar mode={mode} label="Course completion" value={completedSet.size} total={allLessons.length || 1} />
          <p className="mt-2 text-sm text-gray-400">
            {completedSet.size}/{allLessons.length} completed · {progressPercent}%
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-[#141414] p-4">
          <h2 className="text-xl font-semibold text-white">Lessons</h2>

          <div className="mt-4 space-y-5">
            {modules.map((moduleDoc) => {
              const lessons = Array.isArray(moduleDoc.lessons) ? moduleDoc.lessons : [];
              return (
                <div key={moduleDoc.id} className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-400">{moduleDoc.title}</h3>
                  <ul className="space-y-1">
                    {lessons.map((lesson, lessonIndex) => {
                      const completed = completedSet.has(lesson.id);
                      const unlocked = isLessonUnlocked(moduleDoc, lessonIndex, completedLessonIds);
                      const active = activeLesson?.id === lesson.id;

                      return (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            disabled={!unlocked}
                            onClick={() => setActiveLessonId(lesson.id)}
                            className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                              active
                                ? "border-[#f0b64f] bg-[#f59e0b]/20 text-[#f7d79c]"
                                : unlocked
                                  ? "border-white/10 bg-[#101010] text-gray-200 hover:border-white/25"
                                  : "border-white/10 bg-[#0f0f0f] text-gray-500"
                            }`}
                          >
                            {completed ? "✔" : unlocked ? "→" : "•"} {lesson.title}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </aside>

        <article className="rounded-2xl border border-white/10 bg-[#141414] p-6">
          {activeLesson ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-gray-400">Lesson Detail</p>
                  <h2 className="text-3xl font-bold text-white">{activeLesson.title}</h2>
                </div>

                {!completedSet.has(activeLesson.id) ? (
                  <button
                    type="button"
                    onClick={() =>
                      completeLesson({
                        lessonId: activeLesson.id,
                        feedback: { clarity: "Very clear", struggle: "" },
                        durationSeconds: 0
                      })
                    }
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition hover:scale-[1.03] ${
                      mode === "kids"
                        ? "bg-[#65b7c8] text-[#072028] hover:bg-[#7ec6d4]"
                        : "bg-[#f59e0b] text-[#1a1206] hover:bg-[#f8b649]"
                    }`}
                  >
                    Mark Complete
                  </button>
                ) : (
                  <span className="rounded-xl bg-[#f59e0b]/20 px-4 py-2 text-sm text-[#f7d79c]">Completed</span>
                )}
              </div>

              <div className="space-y-4">
                {activeSections.map((section) => (
                  <section key={section.id} className="rounded-xl border border-white/10 bg-[#101010] p-4">
                    <h3 className="text-base font-semibold text-white">{section.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-300">{section.content}</p>
                  </section>
                ))}
              </div>

              {activeInstagramUrl ? (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.open(activeInstagramUrl, "_blank", "noopener,noreferrer");
                    }}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition hover:scale-[1.03] ${
                      mode === "kids"
                        ? "bg-[#22d3ee] text-[#062028] hover:bg-[#5ee3f1]"
                        : "bg-[#f59e0b] text-[#1a1206] hover:bg-[#f8b649]"
                    }`}
                  >
                    Watch on Instagram
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No lesson selected.</p>
          )}
        </article>
      </section>
    </Container>
  );
};
