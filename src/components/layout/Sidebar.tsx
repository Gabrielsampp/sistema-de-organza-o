import { CheckSquare, Flame, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Settings, type LucideIcon } from "lucide-react";
import { useUi, type Route } from "@/stores/ui";

// Só módulos IMPLEMENTADOS aparecem aqui. Módulo novo = um item neste array.
const MAIN: { route: Route; label: string; icon: LucideIcon; key: string }[] = [
  { route: "dashboard", label: "Início", icon: LayoutDashboard, key: "Ctrl+1" },
  { route: "tasks", label: "Tarefas", icon: CheckSquare, key: "Ctrl+2" },
  { route: "habits", label: "Hábitos", icon: Flame, key: "Ctrl+3" },
];

function NavItem({ item, collapsed }: { item: { route: Route; label: string; icon: LucideIcon; key?: string }; collapsed: boolean }) {
  const route = useUi((s) => s.route);
  const navigate = useUi((s) => s.navigate);
  const active = route === item.route;
  const Icon = item.icon;
  return (
    <button
      onClick={() => navigate(item.route)}
      aria-current={active ? "page" : undefined}
      className={`group relative flex h-9 w-full items-center gap-3 rounded-control px-3 text-[13px] transition-colors ${
        active ? "bg-accent/12 text-accent" : "text-fg2 hover:bg-elevated hover:text-fg"
      }`}
    >
      <Icon size={17} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {collapsed && (
        <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-control border border-line-strong bg-elevated px-2 py-1 text-[12px] text-fg shadow-lg group-hover:block">
          {item.label}
          {item.key && <span className="ml-2 text-muted">{item.key}</span>}
        </span>
      )}
    </button>
  );
}

export function Sidebar() {
  const collapsed = useUi((s) => s.sidebarCollapsed);
  const toggle = useUi((s) => s.toggleSidebar);
  return (
    <nav className={`flex h-full shrink-0 flex-col border-r border-line bg-base p-3 transition-[width] duration-200 ${collapsed ? "w-16" : "w-[232px]"}`}>
      <div className="mb-6 flex h-9 items-center gap-2 px-2">
        <div className="size-5 shrink-0 rounded-[6px] bg-accent" />
        {!collapsed && <span className="text-[14px] font-semibold tracking-wide">ATLAS</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        {MAIN.map((i) => (
          <NavItem key={i.route} item={i} collapsed={collapsed} />
        ))}
      </div>
      <div className="flex flex-col gap-1 border-t border-line pt-3">
        <NavItem item={{ route: "settings", label: "Configurações", icon: Settings }} collapsed={collapsed} />
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          className="flex h-9 items-center gap-3 rounded-control px-3 text-muted hover:bg-elevated hover:text-fg"
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          {!collapsed && <span className="text-[12px]">Recolher</span>}
        </button>
      </div>
    </nav>
  );
}
