import { useQueryClient } from "@tanstack/react-query";
import { Component, useEffect, type ReactNode } from "react";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { FinancesPage } from "@/features/finances/FinancesPage";
import { runRecurring } from "@/features/finances/service";
import { HabitsPage } from "@/features/habits/HabitsPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { TasksPage } from "@/features/tasks/TasksPage";
import { useUi, type Route } from "@/stores/ui";

const PAGES: Record<Route, () => ReactNode> = {
  dashboard: () => <DashboardPage />,
  tasks: () => <TasksPage />,
  habits: () => <HabitsPage />,
  finances: () => <FinancesPage />,
  settings: () => <SettingsPage />,
};
const NUMBER_ROUTES: Route[] = ["dashboard", "tasks", "habits", "finances"];

function useShortcuts() {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const s = useUi.getState();
      if (e.key === "Escape") {
        if (s.paletteOpen) s.setPalette(false);
        return; // Drawer trata o próprio Esc
      }
      if (!e.ctrlKey && !e.metaKey) return;
      const k = e.key.toLowerCase();
      if (k === "k") { e.preventDefault(); s.setPalette(!s.paletteOpen); }
      else if (k === "n") { e.preventDefault(); s.triggerQuickAdd(); }
      else if (k === "b") { e.preventDefault(); s.toggleSidebar(); }
      else if (/^[1-9]$/.test(k)) {
        const r = NUMBER_ROUTES[Number(k) - 1];
        if (r) { e.preventDefault(); s.navigate(r); }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="max-w-lg rounded-card border border-danger/40 bg-surface p-6">
          <h1 className="mb-2 text-[16px] font-medium text-danger">Algo deu errado</h1>
          <p className="mb-3 break-words text-fg2">{this.state.error.message}</p>
          <p className="text-[12px] text-muted">Se a mensagem fala em “plugin” ou “invoke”, abra o app com <code>npm run tauri dev</code> (não pelo navegador).</p>
        </div>
      </div>
    );
  }
}

export default function App() {
  useShortcuts();
  const qc = useQueryClient();
  // Gera lançamentos recorrentes devidos (idempotente) ao abrir o app.
  useEffect(() => { runRecurring().then(() => qc.invalidateQueries()).catch((e) => console.error("recorrentes:", e)); }, [qc]);
  const route = useUi((s) => s.route);
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <ErrorBoundary key={route}>{PAGES[route]()}</ErrorBoundary>
      </main>
      <CommandPalette />
    </div>
  );
}
