import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginRequest, signupRequest } from "../api/authApi";
import { getApiErrorMessage, setAuthToken } from "../api/api";
import { useMode } from "../context/ModeContext";
import { useLearningStore } from "../store/useLearningStore";

export const AuthModal = ({ open, initialTab = "login", onClose }) => {
  const navigate = useNavigate();
  const { mode } = useMode();
  const setSession = useLearningStore((state) => state.setSession);

  const [tab, setTab] = useState(initialTab === "signup" ? "signup" : "login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(initialTab === "signup" ? "signup" : "login");
      setError("");
      setLoading(false);
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

  const submitLogin = async (event) => {
    event.preventDefault();
    if (loading) return;

    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setError("Please enter email and password.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const data = await loginRequest({
        email: loginForm.email.trim(),
        password: loginForm.password
      });
      if (!data?.token || !data?.user) {
        throw new Error("Unable to log in right now. Please try again.");
      }

      setAuthToken(data.token);
      setSession({
        token: data.token,
        user: {
          id: String(data.user.id || ""),
          name: String(data.user.name || ""),
          email: String(data.user.email || ""),
          xp: Number(data.user.xp || 0),
          level: Number(data.user.level || 1),
          rankTitle: String(data.user.rankTitle || "")
        }
      });

      onClose();
      navigate("/profile-select", { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Login failed. Check your credentials and try again."));
    } finally {
      setLoading(false);
    }
  };

  const submitSignup = async (event) => {
    event.preventDefault();
    if (loading) return;

    if (!signupForm.name.trim() || !signupForm.email.trim() || !signupForm.password.trim()) {
      setError("Please complete all fields.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const data = await signupRequest({
        name: signupForm.name.trim(),
        email: signupForm.email.trim(),
        password: signupForm.password
      });
      if (!data?.token || !data?.user) {
        throw new Error("Unable to create your account right now. Please try again.");
      }

      setAuthToken(data.token);
      setSession({
        token: data.token,
        user: {
          id: String(data.user.id || ""),
          name: String(data.user.name || ""),
          email: String(data.user.email || ""),
          xp: Number(data.user.xp || 0),
          level: Number(data.user.level || 1),
          rankTitle: String(data.user.rankTitle || "")
        }
      });

      onClose();
      navigate("/profile-select", { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Signup failed. Please try again."));
    } finally {
      setLoading(false);
    }
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
                disabled={loading}
                className={`h-11 w-full rounded-xl text-sm font-semibold transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60 ${submitTone}`}
              >
                {loading ? "Signing in..." : "Continue"}
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
                disabled={loading}
                className={`h-11 w-full rounded-xl text-sm font-semibold transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60 ${submitTone}`}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
