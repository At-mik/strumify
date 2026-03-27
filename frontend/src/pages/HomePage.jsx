import { useMemo } from "react";
import { Link } from "react-router-dom";

import { Card } from "../components/Card";
import { IconInstagram, IconMail, IconTarget, IconWhatsapp, IconYoutube } from "../components/Icons";
import { ProgressBar } from "../components/ProgressBar";
import { RevealOnScroll } from "../components/RevealOnScroll";
import { useMode } from "../context/ModeContext";
import { modules } from "../data/modules";
import { Container } from "../layouts/Container";
import { useLearningStore } from "../store/useLearningStore";
import { getDailyStreak, getOverallProgress } from "../utils/learningPath";

const instructors = [
  {
    handle: "its.atmik",
    name: "Atmik",
    href: "https://www.instagram.com/its.atmik/",
    fallback: "Leads beginner training with clear technique and consistency-first practice."
  },
  {
    handle: "shubh_musico",
    name: "Shubh",
    href: "https://www.instagram.com/shubh_musico/",
    fallback: "Focuses on rhythm feel and musical confidence through guided routines."
  },
  {
    handle: "strumify.in",
    name: "Strumify",
    href: "https://www.instagram.com/strumify.in/",
    fallback: "Shares daily practice ideas and song-ready learning direction."
  }
];

const contactLinks = [
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@Strumify-in", Icon: IconYoutube },
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/strumify.in/", Icon: IconInstagram },
  { id: "whatsapp", label: "WhatsApp", href: "https://chat.whatsapp.com/Kh5YmYY9Ru81LZiPNV3j4z?mode=gi_t", Icon: IconWhatsapp },
  { id: "email", label: "Email", href: "mailto:strumify.in@gmail.com", Icon: IconMail },
  {
    id: "feedback",
    label: "Give Feedback",
    href: "https://docs.google.com/forms/d/e/1FAIpQLScXevIF1-i4zSCZGGhrYaj77rLv0O_5-OFpQIQCFwamCm12og/viewform?usp=header",
    Icon: IconTarget
  }
];

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

export const HomePage = () => {
  const { mode } = useMode();
  const user = useLearningStore((state) => state.user);
  const completedLessonIds = useLearningStore((state) => state.completedLessonIds);
  const dailyCompletions = useLearningStore((state) => state.dailyCompletions);

  const actionLink = user ? "/learn" : "/login";
  const sessions = readPracticeSessions();

  const streakDays = getDailyStreak(dailyCompletions);
  const latestAccuracy = sessions[0]?.accuracyPercent || 0;
  const averageMinutes = sessions.length
    ? Math.round(sessions.reduce((sum, item) => sum + (item.elapsed || 0), 0) / sessions.length / 60)
    : 0;
  const progress = getOverallProgress(modules, completedLessonIds);

  const ctaTone = mode === "kids" ? "from-violet-500 to-fuchsia-500 text-white" : "from-sky-500 to-blue-500 text-[#03101a]";
  const accent = mode === "kids" ? "#8b5cf6" : "#38bdf8";

  const learningHighlights = useMemo(
    () => [
      "Start with your first clean guitar sound.",
      "Build smooth rhythm and stronger control.",
      "Play with confidence through guided practice."
    ],
    []
  );

  return (
    <div className="text-[#f5f5f5]">
      <section className="relative overflow-hidden py-28 md:py-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.08),transparent_45%),#0f0f0f]" />
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          <svg viewBox="0 0 1200 400" className="h-full w-full">
            <path d="M0 210 C120 130 220 300 340 210 C460 120 560 300 680 210 C800 120 900 300 1020 210 C1110 150 1160 190 1200 210" stroke={accent} strokeWidth="3" fill="none" />
          </svg>
        </div>

        <Container className="relative z-10 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <p className="text-sm uppercase tracking-[0.2em] text-gray-400">You’re invited to Strumify by Atmik Shilajiya</p>
            <h1 className="text-4xl font-bold leading-tight text-white md:text-6xl">Learn Guitar with Real Feedback, Not Guesswork</h1>
            <p className="text-lg leading-relaxed text-gray-300">
              Practice with smart guidance, track your growth, and turn daily sessions into real playing confidence.
            </p>
            <Link
              to={actionLink}
              className={`inline-flex rounded-xl bg-gradient-to-r px-6 py-3 text-sm font-semibold shadow-[0_0_22px_rgba(56,189,248,0.35)] transition hover:scale-[1.03] ${ctaTone}`}
            >
              Start Practicing
            </Link>
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <RevealOnScroll className="space-y-7">
          <h2 className="text-3xl font-bold text-white">Built for Real Progress</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card mode={mode} interactive>
              <h3 className="text-lg font-semibold">Structured Lessons</h3>
              <p className="mt-2 text-sm text-gray-300">Follow a clear path from beginner basics to confident rhythm play.</p>
            </Card>
            <Card mode={mode} interactive>
              <h3 className="text-lg font-semibold">Live Guidance</h3>
              <p className="mt-2 text-sm text-gray-300">Practice with feedback that helps you improve timing and control.</p>
            </Card>
            <Card mode={mode} interactive>
              <h3 className="text-lg font-semibold">Creative Flow</h3>
              <p className="mt-2 text-sm text-gray-300">Record ideas, revisit your sessions, and keep building your sound.</p>
            </Card>
          </div>
          </RevealOnScroll>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <RevealOnScroll className="grid gap-5 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-white">Practice with Real Feedback</h2>
            <p className="text-gray-300">
              Improve your timing, accuracy, and control with guided sessions that respond to how you play.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card mode={mode} interactive className="p-4">
              <p className="text-xs text-gray-400">Streak</p>
              <p className="mt-1 text-2xl font-bold text-white">{streakDays}</p>
            </Card>
            <Card mode={mode} interactive className="p-4">
              <p className="text-xs text-gray-400">Avg Minutes</p>
              <p className="mt-1 text-2xl font-bold text-white">{averageMinutes}</p>
            </Card>
            <Card mode={mode} interactive className="p-4">
              <p className="text-xs text-gray-400">Latest Accuracy</p>
              <p className="mt-1 text-2xl font-bold text-white">{latestAccuracy}%</p>
            </Card>
          </div>
          </RevealOnScroll>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <RevealOnScroll className="space-y-5">
          <h2 className="text-3xl font-bold text-white">Record and Create Your Sound</h2>
          <p className="max-w-3xl text-gray-300">
            Capture your playing, layer ideas, and build your own music in a clean recording space.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Record video and audio", "Save sessions and reopen", "Shape tone with effects"].map((item) => (
              <span key={item} className="rounded-full border border-white/15 bg-[#141414] px-4 py-2 text-sm text-gray-200">
                {item}
              </span>
            ))}
          </div>
          </RevealOnScroll>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <RevealOnScroll className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-start">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white">Learn Guitar Step by Step</h2>
            <p className="text-gray-300">
              Follow structured lessons designed to help you build real skills from your first sound to confident playing.
            </p>
            <ul className="space-y-2">
              {learningHighlights.map((line) => (
                <li key={line} className="text-sm text-gray-300">
                  • {line}
                </li>
              ))}
            </ul>
          </div>

          <Card mode={mode} className="p-5">
            <p className="text-sm text-gray-400">Your Course Progress</p>
            <div className="mt-3">
              <ProgressBar mode={mode} label="Completed lessons" value={progress.completed} total={progress.total || 1} />
            </div>
            <p className="mt-3 text-sm text-gray-300">
              {progress.completed}/{progress.total} lessons complete
            </p>
          </Card>
          </RevealOnScroll>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <RevealOnScroll className="space-y-8">
          <h2 className="text-3xl font-bold text-white">Meet Your Instructors</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {instructors.map((instructor) => (
              <Card key={instructor.handle} mode={mode} interactive>
                <img
                  src={`https://unavatar.io/instagram/${instructor.handle}`}
                  alt={`${instructor.name} avatar`}
                  className="mx-auto h-20 w-20 rounded-full object-cover"
                />
                <h3 className="mt-4 text-center text-xl font-semibold text-white">{instructor.name}</h3>
                <p className="mt-2 text-center text-sm text-gray-300">{instructor.fallback}</p>
                <a
                  href={instructor.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mx-auto mt-4 inline-flex rounded-lg border border-white/20 px-4 py-2 text-sm text-gray-100 transition hover:scale-[1.03] hover:border-white/40"
                >
                  Connect
                </a>
              </Card>
            ))}
          </div>
          </RevealOnScroll>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <RevealOnScroll className="space-y-7 text-center">
          <h2 className="text-3xl font-bold text-white">Connect with Strumify</h2>
          <p className="text-gray-300">Reach out anytime through your preferred channel.</p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
            {contactLinks.map(({ id, href, label, Icon }) => (
              <a
                key={id}
                href={href}
                target={href.startsWith("mailto:") ? "_self" : "_blank"}
                rel="noopener noreferrer"
                className="social-btn"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/20">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-100">{label}</p>
              </a>
            ))}
          </div>
          <Link
            to={actionLink}
            className={`inline-flex rounded-xl bg-gradient-to-r px-6 py-3 text-sm font-semibold transition hover:scale-[1.03] ${ctaTone}`}
          >
            Start Your First Session
          </Link>
          </RevealOnScroll>
        </Container>
      </section>
    </div>
  );
};
