"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  ACCENT_COLORS,
  BG_MODES,
  DEFAULT_ACCENT,
  DEFAULT_BG_MODE,
  DEFAULT_BG_OPACITY,
  STORAGE_KEY_ACCENT,
  STORAGE_KEY_BG_MODE,
  STORAGE_KEY_BG_OPACITY,
  type AccentId,
  type BgMode,
} from "@/lib/themes";
import {
  DEFAULT_MODEL,
  STORAGE_KEY_MODEL,
  isModelId,
  type ModelId,
} from "@/lib/models";

type ThemeContextValue = {
  accent: AccentId;
  setAccent: (id: AccentId) => void;
  bgMode: BgMode;
  setBgMode: (mode: BgMode) => void;
  bgOpacity: number;
  setBgOpacity: (opacity: number) => void;
  model: ModelId;
  setModel: (id: ModelId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyAccent(id: AccentId) {
  const color = ACCENT_COLORS.find((c) => c.id === id);
  if (!color) return;
  const root = document.documentElement;
  root.style.setProperty("--accent", color.value);
  root.style.setProperty("--accent-text", color.textOn);
}

function applyBgMode(mode: BgMode) {
  document.documentElement.setAttribute("data-bg-mode", mode);
}

function clampOpacity(value: number): number {
  if (Number.isNaN(value)) return DEFAULT_BG_OPACITY;
  return Math.min(1, Math.max(0, value));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<AccentId>(DEFAULT_ACCENT);
  const [bgMode, setBgModeState] = useState<BgMode>(DEFAULT_BG_MODE);
  const [bgOpacity, setBgOpacityState] = useState<number>(DEFAULT_BG_OPACITY);
  const [model, setModelState] = useState<ModelId>(DEFAULT_MODEL);

  useEffect(() => {
    const storedAccent = window.localStorage.getItem(
      STORAGE_KEY_ACCENT,
    ) as AccentId | null;
    if (storedAccent && ACCENT_COLORS.some((c) => c.id === storedAccent)) {
      setAccentState(storedAccent);
      applyAccent(storedAccent);
    } else {
      applyAccent(DEFAULT_ACCENT);
    }

    const storedMode = window.localStorage.getItem(
      STORAGE_KEY_BG_MODE,
    ) as BgMode | null;
    if (storedMode && BG_MODES.some((m) => m.id === storedMode)) {
      setBgModeState(storedMode);
      applyBgMode(storedMode);
    } else {
      applyBgMode(DEFAULT_BG_MODE);
    }

    const storedOpacityRaw = window.localStorage.getItem(
      STORAGE_KEY_BG_OPACITY,
    );
    if (storedOpacityRaw !== null) {
      const parsed = clampOpacity(Number.parseFloat(storedOpacityRaw));
      setBgOpacityState(parsed);
    }

    const storedModel = window.localStorage.getItem(STORAGE_KEY_MODEL);
    if (isModelId(storedModel)) {
      setModelState(storedModel);
    }
  }, []);

  const setAccent = useCallback((id: AccentId) => {
    setAccentState(id);
    window.localStorage.setItem(STORAGE_KEY_ACCENT, id);
    applyAccent(id);
  }, []);

  const setBgMode = useCallback((mode: BgMode) => {
    setBgModeState(mode);
    window.localStorage.setItem(STORAGE_KEY_BG_MODE, mode);
    applyBgMode(mode);
  }, []);

  const setBgOpacity = useCallback((opacity: number) => {
    const clamped = clampOpacity(opacity);
    setBgOpacityState(clamped);
    window.localStorage.setItem(STORAGE_KEY_BG_OPACITY, clamped.toString());
  }, []);

  const setModel = useCallback((id: ModelId) => {
    setModelState(id);
    window.localStorage.setItem(STORAGE_KEY_MODEL, id);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        accent,
        setAccent,
        bgMode,
        setBgMode,
        bgOpacity,
        setBgOpacity,
        model,
        setModel,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
