"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";

export type ThemeSetting = "system" | "dark" | "light";

interface ThemeContextValue {
  theme: ThemeSetting;
  isDark: boolean;
  setTheme: (t: ThemeSetting) => Promise<void>;
  /** Called by dashboard layout after loading DB profile — no DB write */
  syncFromDB: (t: ThemeSetting | null | undefined) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  isDark: true,
  setTheme: async () => {},
  syncFromDB: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeSetting>("system");
  const [systemDark, setSystemDark] = useState(true);

  // Track OS preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Load from localStorage immediately (before DB response)
  useEffect(() => {
    const saved = localStorage.getItem("wl-theme") as ThemeSetting | null;
    if (saved && ["system", "dark", "light"].includes(saved)) {
      setThemeState(saved);
    }
  }, []);

  const isDark = theme === "dark" || (theme === "system" && systemDark);

  // Apply class to <html> whenever theme changes
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove("light");
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
      html.classList.add("light");
    }
  }, [isDark]);

  // User-triggered change — save to localStorage + DB
  const setTheme = useCallback(async (t: ThemeSetting) => {
    setThemeState(t);
    localStorage.setItem("wl-theme", t);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from("sales_reps")
          .update({ theme: t })
          .eq("user_id", session.user.id);
      }
    } catch {
      // localStorage already saved — DB sync is best-effort
    }
  }, []);

  // Dashboard layout calls this once after loading profile (no DB write)
  const syncFromDB = useCallback((t: ThemeSetting | null | undefined) => {
    if (!t || !["system", "dark", "light"].includes(t)) return;
    setThemeState(t);
    localStorage.setItem("wl-theme", t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, syncFromDB }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
