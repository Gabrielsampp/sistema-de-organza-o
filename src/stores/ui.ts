import { create } from "zustand";

export type Route = "dashboard" | "tasks" | "habits" | "settings";

const SIDEBAR_KEY = "atlas.sidebarCollapsed";
const readCollapsed = () => {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
};

interface UiState {
  route: Route;
  sidebarCollapsed: boolean;
  paletteOpen: boolean;
  openTaskId: string | null;
  /** Incrementa a cada Ctrl+N; a página atual reage focando seu quick-add. */
  quickAddTick: number;
  navigate: (r: Route) => void;
  toggleSidebar: () => void;
  setPalette: (open: boolean) => void;
  openTask: (id: string | null) => void;
  triggerQuickAdd: () => void;
}

export const useUi = create<UiState>((set) => ({
  route: "dashboard",
  sidebarCollapsed: readCollapsed(),
  paletteOpen: false,
  openTaskId: null,
  quickAddTick: 0,
  navigate: (route) => set({ route }),
  toggleSidebar: () =>
    set((s) => {
      const next = !s.sidebarCollapsed;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignora */
      }
      return { sidebarCollapsed: next };
    }),
  setPalette: (paletteOpen) => set({ paletteOpen }),
  openTask: (openTaskId) => set({ openTaskId }),
  triggerQuickAdd: () => set((s) => ({ quickAddTick: s.quickAddTick + 1 })),
}));
