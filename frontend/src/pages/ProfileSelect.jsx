import { Navigate, useNavigate } from "react-router-dom";

import { Card } from "../components/Card";
import { useMode } from "../context/ModeContext";
import { Container } from "../layouts/Container";
import { useLearningStore } from "../store/useLearningStore";

const options = [
  {
    id: "mature",
    icon: "🎸",
    title: "I’m learning myself",
    text: "Choose the premium mature experience focused on precision and progression."
  },
  {
    id: "kids",
    icon: "🟢",
    title: "For my child",
    text: "Choose the playful gamified mode with encouraging language and XP feedback."
  }
];

export const ProfileSelect = () => {
  const navigate = useNavigate();

  const user = useLearningStore((state) => state.user);
  const setStoreMode = useLearningStore((state) => state.setMode);
  const { setMode } = useMode();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-brand-text">
      <Container className="flex items-center justify-center">
        <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#161616] p-8">
          <h1 className="text-center text-3xl font-semibold">Who are you learning for?</h1>
          <p className="mt-3 text-center text-sm text-brand-text/70">Select a profile mode. You can switch later.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setMode(option.id);
                  setStoreMode(option.id);
                  navigate("/", { replace: true });
                }}
                className="text-left transition hover:scale-[1.02]"
              >
                <Card mode="mature" interactive className="h-full">
                  <p className="text-3xl">{option.icon}</p>
                  <h2 className="mt-4 text-xl font-semibold">{option.title}</h2>
                  <p className="mt-2 text-sm text-brand-text/75">{option.text}</p>
                </Card>
              </button>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};
