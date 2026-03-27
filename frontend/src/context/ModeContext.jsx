import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { useLearningStore } from "../store/useLearningStore";

const MODE_STORAGE_KEY = "strumify_mode";

const normalizeMode = (value) => (value === "kids" ? "kids" : "mature");

const readInitialMode = () => {
  if (typeof window === "undefined") return "mature";

  try {
    const raw = localStorage.getItem(MODE_STORAGE_KEY);
    return normalizeMode(JSON.parse(raw));
  } catch {
    return "mature";
  }
};

const ModeContext = createContext({
  mode: "mature",
  setMode: () => {}
});

export const ModeProvider = ({ children }) => {
  const storedMode = useLearningStore((state) => state.mode);
  const persistStoreMode = useLearningStore((state) => state.setMode);

  const [mode, setModeState] = useState(() => normalizeMode(storedMode || readInitialMode()));

  useEffect(() => {
    if (!storedMode) return;
    const nextMode = normalizeMode(storedMode);
    setModeState((currentMode) => (currentMode === nextMode ? currentMode : nextMode));
  }, [storedMode]);

  const setMode = (nextMode) => {
    const normalized = normalizeMode(nextMode);

    setModeState(normalized);
    persistStoreMode(normalized);

    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(MODE_STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
      console.error("Unable to persist mode", error);
    }
  };

  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
};

export const useMode = () => useContext(ModeContext);
