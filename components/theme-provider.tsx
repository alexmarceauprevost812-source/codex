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
  STORAGE_KEY_ACCENT,
  STORAGE_KEY_API_KEY,
  STORAGE_KEY_AUTO_COMMIT,
  STORAGE_KEY_BG_MODE,
  STORAGE_KEY_GITHUB_BRANCH,
  STORAGE_KEY_GITHUB_REPO,
  STORAGE_KEY_GITHUB_TOKEN,
  type AccentId,
  type BgMode,
} from "@/lib/themes";
import {
  DEFAULT_MODEL,
  STORAGE_KEY_MODEL,
  isModelId,
  type ModelId,
} from "@/lib/models";

export type GithubProject = {
  token: string;
  repo: string; // "owner/repo"
  branch: string;
};

type ThemeContextValue = {
  accent: AccentId;
  setAccent: (id: AccentId) => void;
  bgMode: BgMode;
  setBgMode: (mode: BgMode) => void;
  model: ModelId;
  setModel: (id: ModelId) => void;
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  githubProject: GithubProject | null;
  connectGithubProject: (project: GithubProject) => void;
  disconnectGithubProject: () => void;
  autoCommit: boolean;
  setAutoCommit: (value: boolean) => void;
};

function isValidApiKey(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("sk-ant-");
}

const REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function isValidGithubProject(value: unknown): value is GithubProject {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.token === "string" &&
    v.token.length > 10 &&
    typeof v.repo === "string" &&
    REPO_PATTERN.test(v.repo) &&
    typeof v.branch === "string" &&
    v.branch.length > 0
  );
}

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<AccentId>(DEFAULT_ACCENT);
  const [bgMode, setBgModeState] = useState<BgMode>(DEFAULT_BG_MODE);
  const [model, setModelState] = useState<ModelId>(DEFAULT_MODEL);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [githubProject, setGithubProjectState] =
    useState<GithubProject | null>(null);
  const [autoCommit, setAutoCommitState] = useState<boolean>(true);

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

    const storedMode = window.localStorage.getItem(STORAGE_KEY_BG_MODE);
    if (storedMode && BG_MODES.some((m) => m.id === storedMode)) {
      setBgModeState(storedMode as BgMode);
      applyBgMode(storedMode as BgMode);
    } else {
      // Legacy "video" value or unknown — fall back to default.
      applyBgMode(DEFAULT_BG_MODE);
    }

    const storedModel = window.localStorage.getItem(STORAGE_KEY_MODEL);
    if (isModelId(storedModel)) {
      setModelState(storedModel);
    }

    const storedApiKey = window.localStorage.getItem(STORAGE_KEY_API_KEY);
    if (isValidApiKey(storedApiKey)) {
      setApiKeyState(storedApiKey);
    }

    const token = window.localStorage.getItem(STORAGE_KEY_GITHUB_TOKEN);
    const repo = window.localStorage.getItem(STORAGE_KEY_GITHUB_REPO);
    const branch =
      window.localStorage.getItem(STORAGE_KEY_GITHUB_BRANCH) ?? "main";
    const candidate = { token, repo, branch };
    if (isValidGithubProject(candidate)) {
      setGithubProjectState(candidate);
    }

    const storedAutoCommit = window.localStorage.getItem(STORAGE_KEY_AUTO_COMMIT);
    if (storedAutoCommit !== null) {
      setAutoCommitState(storedAutoCommit === "1");
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

  const setModel = useCallback((id: ModelId) => {
    setModelState(id);
    window.localStorage.setItem(STORAGE_KEY_MODEL, id);
  }, []);

  const setApiKey = useCallback((key: string | null) => {
    if (key && isValidApiKey(key)) {
      setApiKeyState(key);
      window.localStorage.setItem(STORAGE_KEY_API_KEY, key);
    } else {
      setApiKeyState(null);
      window.localStorage.removeItem(STORAGE_KEY_API_KEY);
    }
  }, []);

  const connectGithubProject = useCallback((project: GithubProject) => {
    if (!isValidGithubProject(project)) return;
    setGithubProjectState(project);
    window.localStorage.setItem(STORAGE_KEY_GITHUB_TOKEN, project.token);
    window.localStorage.setItem(STORAGE_KEY_GITHUB_REPO, project.repo);
    window.localStorage.setItem(STORAGE_KEY_GITHUB_BRANCH, project.branch);
  }, []);

  const disconnectGithubProject = useCallback(() => {
    setGithubProjectState(null);
    window.localStorage.removeItem(STORAGE_KEY_GITHUB_TOKEN);
    window.localStorage.removeItem(STORAGE_KEY_GITHUB_REPO);
    window.localStorage.removeItem(STORAGE_KEY_GITHUB_BRANCH);
  }, []);

  const setAutoCommit = useCallback((value: boolean) => {
    setAutoCommitState(value);
    window.localStorage.setItem(STORAGE_KEY_AUTO_COMMIT, value ? "1" : "0");
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        accent,
        setAccent,
        bgMode,
        setBgMode,
        model,
        setModel,
        apiKey,
        setApiKey,
        githubProject,
        connectGithubProject,
        disconnectGithubProject,
        autoCommit,
        setAutoCommit,
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
