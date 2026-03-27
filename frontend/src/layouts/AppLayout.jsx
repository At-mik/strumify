import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useSearchParams } from "react-router-dom";

import { setAuthToken } from "../api/api";
import { AuthModal } from "../components/AuthModal";
import { Footer } from "../components/Footer";
import { useMode } from "../context/ModeContext";
import { useLearningStore } from "../store/useLearningStore";

const desktopNav = [
  { label: "Learn", to: "/learn" },
  { label: "Studio", to: "/studio" },
  { label: "Tools", to: "/tools" }
];

export const AppLayout = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { mode, setMode } = useMode();
  const user = useLearningStore((state) => state.user);
  const logout = useLearningStore((state) => state.logout);

  const [headerHidden, setHeaderHidden] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState("login");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const desktopMenuRef = useRef(null);
  const mobileSheetRef = useRef(null);
  const menuButtonRef = useRef(null);
  const patternRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onScroll = () => {
      const currentY = window.scrollY || 0;

      if (currentY > lastScrollY.current + 8) {
        setHeaderHidden(true);
      } else if (currentY < lastScrollY.current - 8) {
        setHeaderHidden(false);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setHeaderHidden(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const authMode = searchParams.get("auth");
    if (authMode !== "login" && authMode !== "signup") return;

    setAuthInitialTab(authMode);
    setAuthOpen(true);
  }, [searchParams]);

  const clearAuthParam = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("auth");
    setSearchParams(next, { replace: true });
  };

  const openAuth = (tab = "login") => {
    setAuthInitialTab(tab === "signup" ? "signup" : "login");
    setAuthOpen(true);
  };

  const closeAuth = () => {
    setAuthOpen(false);
    clearAuthParam();
  };

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!profileMenuOpen) return;
      if (
        desktopMenuRef.current?.contains(event.target) ||
        mobileSheetRef.current?.contains(event.target) ||
        menuButtonRef.current?.contains(event.target)
      ) {
        return;
      }
      setProfileMenuOpen(false);
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") setProfileMenuOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    const onUnauthorized = () => {
      setAuthToken("");
      logout();
      setAuthInitialTab("login");
      setAuthOpen(true);
    };

    window.addEventListener("strumify:unauthorized", onUnauthorized);
    return () => window.removeEventListener("strumify:unauthorized", onUnauthorized);
  }, [logout]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return undefined;

    let rafId = 0;
    let animating = false;
    let targetY = window.scrollY || 0;
    let currentY = targetY;

    const render = () => {
      currentY += (targetY - currentY) * 0.09;

      const lineOpacity = Math.min(0.2, 0.1 + targetY / 4000);
      const glowOpacity = Math.min(0.18, 0.07 + targetY / 5000);
      const offset = -currentY * 0.06;

      if (patternRef.current) {
        patternRef.current.style.transform = `translate3d(0, ${offset}px, 0)`;
        patternRef.current.style.opacity = String(lineOpacity);
      }

      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(0, ${offset * 0.7}px, 0)`;
        glowRef.current.style.opacity = String(glowOpacity);
      }

      if (Math.abs(targetY - currentY) > 0.3) {
        rafId = window.requestAnimationFrame(render);
      } else {
        animating = false;
      }
    };

    const onScroll = () => {
      targetY = window.scrollY || 0;
      if (!animating) {
        animating = true;
        rafId = window.requestAnimationFrame(render);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const shellTone = "bg-[#0f0f0f]";
  const neonColor = mode === "kids" ? "34,211,238" : "245,158,11";
  const neonPattern =
    mode === "kids"
      ? "repeating-linear-gradient(0deg,rgba(34,211,238,0.16)_0px,rgba(34,211,238,0.16)_1px,transparent_1px,transparent_42px),repeating-linear-gradient(90deg,rgba(34,211,238,0.12)_0px,rgba(34,211,238,0.12)_1px,transparent_1px,transparent_42px)"
      : "repeating-linear-gradient(0deg,rgba(245,158,11,0.16)_0px,rgba(245,158,11,0.16)_1px,transparent_1px,transparent_42px),repeating-linear-gradient(90deg,rgba(245,158,11,0.12)_0px,rgba(245,158,11,0.12)_1px,transparent_1px,transparent_42px)";
  const initials = user?.name?.trim()?.slice(0, 2).toUpperCase() || "S";

  return (
    <div className={`relative min-h-screen overflow-x-hidden text-[#f5f5f5] ${shellTone}`}>
      <div
        ref={patternRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.12] will-change-transform"
        style={{ backgroundImage: neonPattern }}
      />
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.08] transition-opacity duration-300 will-change-transform"
        style={{
          background: `radial-gradient(circle at 50% -10%, rgba(${neonColor}, 0.28), transparent 50%), radial-gradient(circle at 100% 30%, rgba(${neonColor}, 0.2), transparent 45%)`
        }}
      />

      <header
        className={`fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0f0f0f]/90 backdrop-blur transition-transform duration-300 ease-in-out ${
          headerHidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto grid max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 md:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3 justify-self-start">
            <img src="/logo.png" alt="Strumify logo" className="h-10 w-10 rounded-lg object-cover" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold tracking-[0.2em] text-[#f7c16f]">STRUMIFY</p>
              <p className="text-xs text-gray-400">Guitar Learning Platform</p>
            </div>
          </Link>

          <nav className="mx-auto flex max-w-[56vw] items-center gap-1 overflow-x-auto whitespace-nowrap md:max-w-none md:justify-center">
            {desktopNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-2.5 py-2 text-xs font-medium transition md:px-3 md:text-sm ${
                    isActive
                      ? mode === "kids"
                        ? "bg-[#22d3ee] text-[#052028]"
                        : "bg-[#f59e0b] text-[#1a1206]"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="relative justify-self-end">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#191919] text-xs font-semibold text-white transition hover:scale-[1.03] ${
                profileMenuOpen
                  ? mode === "kids"
                    ? "shadow-[0_0_16px_rgba(34,211,238,0.35)]"
                    : "shadow-[0_0_16px_rgba(245,158,11,0.35)]"
                  : ""
              }`}
              aria-label="Open profile menu"
            >
              {initials}
            </button>

            <div
              ref={desktopMenuRef}
              className={`absolute right-0 top-12 hidden w-64 rounded-2xl border border-white/12 bg-[#121212]/95 p-3 shadow-2xl backdrop-blur md:block ${
                profileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
              } transition-opacity duration-200`}
            >
              {user ? (
                <NavLink
                  to="/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-gray-100 transition hover:bg-white/10"
                >
                  Profile
                </NavLink>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    openAuth("login");
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-100 transition hover:bg-white/10"
                >
                  Profile
                </button>
              )}

              <div className="mt-2 rounded-lg border border-white/10 bg-[#0f0f0f] p-1">
                <p className="px-2 pb-1 text-[11px] uppercase tracking-[0.08em] text-gray-400">Switch Mode</p>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setMode("mature")}
                    className={`rounded-md px-2 py-1.5 text-xs transition ${mode === "mature" ? "bg-[#f59e0b] text-[#1a1206]" : "text-gray-300 hover:bg-white/8"}`}
                  >
                    Mature
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("kids")}
                    className={`rounded-md px-2 py-1.5 text-xs transition ${mode === "kids" ? "bg-[#22d3ee] text-[#052028]" : "text-gray-300 hover:bg-white/8"}`}
                  >
                    Kids
                  </button>
                </div>
              </div>

              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    logout();
                  }}
                  className="mt-2 block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-100 transition hover:bg-white/10"
                >
                  Logout
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    openAuth("signup");
                  }}
                  className="mt-2 block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-100 transition hover:bg-white/10"
                >
                  Signup
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 pb-8 pt-20">
        <Outlet />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>

      <div
        ref={mobileSheetRef}
        className={`fixed inset-x-0 top-[72px] z-50 border-b border-white/10 bg-[#111111]/95 p-4 backdrop-blur md:hidden ${
          profileMenuOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        } transition-all duration-200`}
      >
        {user ? (
          <NavLink
            to="/profile"
            onClick={() => setProfileMenuOpen(false)}
            className="block rounded-lg px-3 py-3 text-sm text-gray-100 transition hover:bg-white/10"
          >
            Profile
          </NavLink>
        ) : (
          <button
            type="button"
            onClick={() => {
              setProfileMenuOpen(false);
              openAuth("login");
            }}
            className="block w-full rounded-lg px-3 py-3 text-left text-sm text-gray-100 transition hover:bg-white/10"
          >
            Profile
          </button>
        )}

        <div className="mt-2 rounded-lg border border-white/10 bg-[#0f0f0f] p-2">
          <p className="px-2 pb-1 text-[11px] uppercase tracking-[0.08em] text-gray-400">Switch Mode</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("mature")}
              className={`min-h-[44px] rounded-lg px-3 text-sm transition ${mode === "mature" ? "bg-[#f59e0b] text-[#1a1206]" : "bg-[#1a1a1a] text-gray-200"}`}
            >
              Mature
            </button>
            <button
              type="button"
              onClick={() => setMode("kids")}
              className={`min-h-[44px] rounded-lg px-3 text-sm transition ${mode === "kids" ? "bg-[#22d3ee] text-[#052028]" : "bg-[#1a1a1a] text-gray-200"}`}
            >
              Kids
            </button>
          </div>
        </div>

        {user ? (
          <button
            type="button"
            onClick={() => {
              setProfileMenuOpen(false);
              logout();
            }}
            className="mt-2 block w-full rounded-lg px-3 py-3 text-left text-sm text-gray-100 transition hover:bg-white/10"
          >
            Logout
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setProfileMenuOpen(false);
              openAuth("signup");
            }}
            className="mt-2 block w-full rounded-lg px-3 py-3 text-left text-sm text-gray-100 transition hover:bg-white/10"
          >
            Signup
          </button>
        )}
      </div>

      <AuthModal open={authOpen} initialTab={authInitialTab} onClose={closeAuth} />
    </div>
  );
};
