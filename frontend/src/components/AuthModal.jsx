import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useMode } from "../context/ModeContext";
import { useLearningStore } from "../store/useLearningStore";

export const AuthModal = ({ open, initialTab = "login", onClose }) => {
  const navigate = useNavigate();
  const { mode } = useMode();
  const setUser = useLearningStore((state) => state.setUser);

  const [tab, setTab] = useState(initialTab === "signup" ? "signup" : "login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTab(initialTab === "signup" ? "signup" : "login");
      setError("");
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const activeTone = mode === "kids" ? "bg-[#8b5cf6] text-white" : "bg-[#38bdf8] text-[#03101a]";
  const submitTone = mode === "kids" ? "bg-[#8b5cf6] text-white hover:bg-[#9d78fb]" : "bg-[#38bdf8] text-[#03101a] hover:bg-[#67d0fc]";

  const submitLogin = (event) => {
    event.preventDefault();
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setError("Please enter email and password.");
      return;
    }

    setUser({
      name: loginForm.email.split("@")[0],
      email: loginForm.email
    });
    onClose();
    navigate("/profile-select", { replace: true });
  };

  const submitSignup = (event) => {
    event.preventDefault();
    if (!signupForm.name.trim() || !signupForm.email.trim() || !signupForm.password.trim()) {
      setError("Please complete all fields.");
      return;
    }

    setUser({
      name: signupForm.name,
      email: signupForm.email
    });
    onClose();
    navigate("/profile-select", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-6">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#111111]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="inline-flex rounded-lg border border-white/15 bg-[#151515] p-1 text-sm">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setError("");
              }}
              className={`rounded-md px-3 py-1.5 transition ${tab === "login" ? activeTone : "text-gray-300"}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup");
                setError("");
              }}
              className={`rounded-md px-3 py-1.5 transition ${tab === "signup" ? activeTone : "text-gray-300"}`}
            >
              Signup
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/20 px-3 py-1 text-sm text-gray-200 transition hover:border-[#38bdf8] hover:text-[#d4f4ff]"
          >
            Close
          </button>
        </div>

        <div className="px-4 py-4">
          {tab === "login" ? (
            <form className="space-y-3" onSubmit={submitLogin}>
              <label className="block text-sm">
                Email
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-xl border border-white/15 bg-[#0f0f0f] px-3"
                  required
                />
              </label>

              <label className="block text-sm">
                Password
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-xl border border-white/15 bg-[#0f0f0f] px-3"
                  required
                />
              </label>

              {error ? <p className="text-sm text-red-300">{error}</p> : null}

              <button
                type="submit"
                className={`h-11 w-full rounded-xl text-sm font-semibold transition hover:scale-[1.03] ${submitTone}`}
              >
                Continue
              </button>
            </form>
          ) : (
            <form className="space-y-3" onSubmit={submitSignup}>
              <label className="block text-sm">
                Name
                <input
                  type="text"
                  value={signupForm.name}
                  onChange={(event) => setSignupForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-xl border border-white/15 bg-[#0f0f0f] px-3"
                  required
                />
              </label>

              <label className="block text-sm">
                Email
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={(event) => setSignupForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-xl border border-white/15 bg-[#0f0f0f] px-3"
                  required
                />
              </label>

              <label className="block text-sm">
                Password
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={(event) => setSignupForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-xl border border-white/15 bg-[#0f0f0f] px-3"
                  required
                />
              </label>

              {error ? <p className="text-sm text-red-300">{error}</p> : null}

              <button
                type="submit"
                className={`h-11 w-full rounded-xl text-sm font-semibold transition hover:scale-[1.03] ${submitTone}`}
              >
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
