import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const AXIS = { fontSize: 11, fill: "#7c7c85" };
const GRID = "#1b1b1e";
const tooltipProps = {
  contentStyle: { background: "#151517", border: "1px solid #2a2a2e", borderRadius: 8, fontSize: 12, color: "#ececee" },
  labelStyle: { color: "#a0a0a8" },
  itemStyle: { color: "#ececee" },
  cursor: { fill: "rgba(255,255,255,0.04)" },
} as const;

export interface Series { key: string; name: string; color: string }
type Row = Record<string, string | number>;

/** Responde: "como evoluiu ao longo do tempo?" */
export function AreaTrend({ data, xKey, series, height = 220, format }: {
  data: Row[]; xKey: string; series: Series[]; height?: number; format?: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} width={52} tickFormatter={format} />
        <Tooltip {...tooltipProps} formatter={(v: number) => (format ? format(v) : v)} />
        {series.map((s) => (
          <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} fill={`url(#g-${s.key})`} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Responde: "quanto por período?" */
export function Bars({ data, xKey, series, height = 220, stacked = false, format }: {
  data: Row[]; xKey: string; series: Series[]; height?: number; stacked?: boolean; format?: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={3}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} width={48} allowDecimals={false} tickFormatter={format} />
        <Tooltip {...tooltipProps} formatter={(v: number) => (format ? format(v) : v)} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} stackId={stacked ? "a" : undefined} maxBarSize={22} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface Slice { name: string; value: number; color: string }

/** Responde: "para onde foi o dinheiro?" */
export function Donut({ data, height = 220, format }: { data: Slice[]; height?: number; format: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
          {data.map((s) => <Cell key={s.name} fill={s.color} />)}
        </Pie>
        <Tooltip {...tooltipProps} formatter={(v: number) => format(v)} />
      </PieChart>
    </ResponsiveContainer>
  );
}
