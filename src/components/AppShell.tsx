import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FlaskConical, Brain, Target, TrendingDown, Github, Linkedin } from "lucide-react";
import { motion } from "framer-motion";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, code: "01" },
  { to: "/data-lab", label: "Data Lab", icon: FlaskConical, code: "02" },
  { to: "/models", label: "AI Models", icon: Brain, code: "03" },
  { to: "/predict", label: "Predict Churn", icon: Target, code: "04" },
  { to: "/impact", label: "Business Impact", icon: TrendingDown, code: "05" },
] as const;

export function AppShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-hairline bg-sidebar/80 backdrop-blur-xl sticky top-0 h-screen">
        <div className="px-7 pt-8 pb-6 border-b border-hairline">
          <Link to="/" className="block group">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-extrabold tracking-tight text-glow-crimson text-foreground">Churn</span>
              <span className="font-display text-3xl font-extrabold text-crimson">IQ</span>
            </div>
            <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Customer Intelligence · v2.0
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV.map((item) => {
            const active = path === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                  active
                    ? "bg-crimson/10 text-foreground"
                    : "text-muted-foreground hover:bg-panel-2/50 hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-crimson glow-crimson"
                  />
                )}
                <span className="font-mono text-[10px] text-muted-foreground/60 w-5">{item.code}</span>
                <Icon className="h-4 w-4" strokeWidth={active ? 2.5 : 1.8} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-5 border-t border-hairline space-y-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">Engineer</div>
            <div className="text-sm font-display font-semibold text-foreground leading-tight">
              Deol Allwyn<br />Samuel J.B
            </div>
            <div className="text-xs text-muted-foreground mt-1">VLSI · CIT</div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-hairline">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Live · GB Model</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Mobile bar */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-hairline bg-sidebar/80 backdrop-blur-xl sticky top-0 z-40">
          <Link to="/" className="font-display text-2xl font-extrabold">
            Churn<span className="text-crimson">IQ</span>
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Deol A.S · VLSI</span>
        </div>
        <div className="lg:hidden border-b border-hairline overflow-x-auto">
          <div className="flex gap-1 px-3 py-2 min-w-max">
            {NAV.map((item) => {
              const active = path === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                    active ? "bg-crimson text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="px-6 lg:px-12 py-8 lg:py-12 max-w-[1400px] mx-auto">
          <Outlet />
        </div>

        <footer className="border-t border-hairline px-6 lg:px-12 py-6 mt-12">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>
              <span className="font-display font-bold text-foreground">ChurnIQ</span> · Customer Intelligence Platform
            </div>
            <div className="font-mono">
              Designed & engineered by Deol Allwyn Samuel J.B · CIT VLSI · {new Date().getFullYear()}
            </div>
            <div className="flex gap-3">
              <Github className="h-4 w-4 hover:text-foreground transition" />
              <Linkedin className="h-4 w-4 hover:text-foreground transition" />
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}