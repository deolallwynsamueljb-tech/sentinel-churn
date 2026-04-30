import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function SectionLabel({ children, code }: { children: ReactNode; code?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5 mt-2">
      {code && <span className="font-mono text-[10px] text-crimson tracking-widest">[{code}]</span>}
      <span className="font-display text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
        {children}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-hairline to-transparent" />
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  accent = "crimson",
  index = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "crimson" | "teal" | "amber" | "azure";
  index?: number;
}) {
  const colorMap = {
    crimson: "var(--crimson)",
    teal: "var(--teal)",
    amber: "var(--amber)",
    azure: "var(--azure)",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="relative panel rounded-2xl p-5 overflow-hidden group hover:border-crimson/40 transition-colors"
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${colorMap[accent]}, transparent)` }}
      />
      <div
        className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-10 group-hover:opacity-20 transition"
        style={{ background: colorMap[accent] }}
      />
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="font-display text-3xl font-bold mt-2 text-foreground" style={{ textShadow: `0 0 20px color-mix(in oklab, ${colorMap[accent]} 40%, transparent)` }}>
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </motion.div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("panel rounded-2xl p-6", className)}>{children}</div>;
}

export function Pill({ children, color = "crimson" }: { children: ReactNode; color?: "crimson" | "teal" | "amber" | "azure" }) {
  const map = {
    crimson: "bg-crimson/12 text-crimson border-crimson/30",
    teal: "bg-teal/12 text-teal border-teal/30",
    amber: "bg-amber/12 text-amber border-amber/30",
    azure: "bg-azure/12 text-azure border-azure/30",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium font-mono", map[color])}>
      {children}
    </span>
  );
}

export function PageHero({ kicker, title, sub }: { kicker: string; title: string; sub: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-crimson mb-3">{kicker}</div>
      <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.05]">
        {title}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-2xl">{sub}</p>
    </motion.div>
  );
}