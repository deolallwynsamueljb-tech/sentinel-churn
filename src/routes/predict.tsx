import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Phone, Gift, ShieldAlert, ArrowRight } from "lucide-react";
import { predictChurn, RISK_COLOR, RISK_ACTIONS, type CustomerInput } from "@/lib/churn-engine";
import { Panel, PageHero, SectionLabel, Pill } from "@/components/ui-bits";

export const Route = createFileRoute("/predict")({
  head: () => ({
    meta: [
      { title: "Predict Churn — ChurnIQ" },
      { name: "description", content: "Live churn risk prediction with confidence band, top drivers and retention playbook." },
    ],
  }),
  component: Predict,
});

function Slider({
  label, value, set, min, max, step = 1, unit = "",
}: { label: string; value: number; set: (v: number) => void; min: number; max: number; step?: number; unit?: string }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</label>
        <span className="font-display text-lg font-bold text-foreground">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="w-full h-1.5 bg-panel-2 rounded-full appearance-none cursor-pointer accent-crimson"
        style={{
          background: `linear-gradient(to right, var(--crimson) 0%, var(--crimson) ${((value - min) / (max - min)) * 100}%, var(--panel-2) ${((value - min) / (max - min)) * 100}%, var(--panel-2) 100%)`,
        }}
      />
    </div>
  );
}

function Select<T extends string>({
  label, value, set, options,
}: { label: string; value: T; set: (v: T) => void; options: readonly T[] }) {
  return (
    <div>
      <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-2">{label}</label>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 3)}, 1fr)` }}>
        {options.map((o) => (
          <button
            key={o}
            onClick={() => set(o)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
              value === o
                ? "bg-crimson text-primary-foreground border-crimson"
                : "bg-panel-2 text-muted-foreground border-hairline hover:border-crimson/40 hover:text-foreground"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Predict() {
  const [c, setC] = useState<CustomerInput>({
    tenure: 8,
    monthlyCharges: 89,
    contract: "Month-to-month",
    internet: "Fiber Optic",
    payment: "Electronic check",
    paperless: "Yes",
    onlineSecurity: "No",
    satisfaction: 2,
    supportTickets: 4,
    latePayments: 2,
  });
  const [analyzed, setAnalyzed] = useState(true);

  const result = useMemo(() => predictChurn(c), [c]);
  const pct = result.probability * 100;
  const color = RISK_COLOR[result.band];

  const update = <K extends keyof CustomerInput>(k: K, v: CustomerInput[K]) => {
    setC((prev) => ({ ...prev, [k]: v }));
    setAnalyzed(false);
  };

  const ltvAtRisk = c.monthlyCharges * 24;

  return (
    <>
      <PageHero
        kicker="Predictor · Gradient Boosting · 0.934 AUC"
        title="Score any customer in under a second."
        sub="Tweak the profile on the left, watch the verdict, drivers and retention playbook update in real time."
      />

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
        {/* Inputs */}
        <Panel>
          <SectionLabel code="D1">Customer profile</SectionLabel>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <Slider label="Tenure" value={c.tenure} set={(v) => update("tenure", v)} min={1} max={72} unit=" mo" />
              <Slider label="Monthly charges" value={Math.round(c.monthlyCharges)} set={(v) => update("monthlyCharges", v)} min={20} max={120} unit=" $" />
              <Slider label="Satisfaction" value={c.satisfaction} set={(v) => update("satisfaction", v)} min={1} max={5} unit=" /5" />
              <Slider label="Support tickets" value={c.supportTickets} set={(v) => update("supportTickets", v)} min={0} max={15} />
              <Slider label="Late payments" value={c.latePayments} set={(v) => update("latePayments", v)} min={0} max={5} />
            </div>
            <Select label="Contract" value={c.contract} set={(v) => update("contract", v)} options={["Month-to-month", "One year", "Two year"] as const} />
            <Select label="Internet" value={c.internet} set={(v) => update("internet", v)} options={["DSL", "Fiber Optic", "No"] as const} />
            <Select label="Payment" value={c.payment} set={(v) => update("payment", v)} options={["Electronic check", "Mailed check", "Bank transfer", "Credit card"] as const} />
            <div className="grid grid-cols-2 gap-5">
              <Select label="Online security" value={c.onlineSecurity} set={(v) => update("onlineSecurity", v)} options={["Yes", "No"] as const} />
              <Select label="Paperless billing" value={c.paperless} set={(v) => update("paperless", v)} options={["Yes", "No"] as const} />
            </div>

            <button
              onClick={() => setAnalyzed(true)}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-crimson text-primary-foreground font-display font-bold tracking-wide hover:bg-crimson-glow transition glow-crimson"
            >
              <Sparkles className="h-4 w-4" /> Analyse customer risk <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </Panel>

        {/* Output */}
        <div className="space-y-4">
          <Panel className="overflow-hidden relative">
            <div className="absolute inset-0 opacity-30 grid-bg pointer-events-none" />
            <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full opacity-25" style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }} />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Verdict</div>
                <Pill color={result.band === "Low Risk" ? "teal" : result.band === "Medium Risk" ? "amber" : "crimson"}>
                  {result.band}
                </Pill>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={pct.toFixed(1)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="my-4"
                >
                  <div className="font-display text-7xl font-extrabold leading-none" style={{ color, textShadow: `0 0 40px color-mix(in oklab, ${color} 50%, transparent)` }}>
                    {pct.toFixed(1)}<span className="text-3xl">%</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Churn probability · via Gradient Boosting
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* gauge */}
              <div className="relative h-3 w-full bg-panel-2 rounded-full overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 80, damping: 18 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, var(--teal), var(--amber), var(--crimson))` }}
                />
                {[30, 50, 70].map((t) => (
                  <div key={t} className="absolute top-0 bottom-0 w-px bg-obsidian" style={{ left: `${t}%` }} />
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-2">
                <span>SAFE</span><span>WATCH</span><span>HIGH</span><span>CRITICAL</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-hairline">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">LTV at risk</div>
                  <div className="font-display text-lg font-bold mt-1">${ltvAtRisk.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Tenure</div>
                  <div className="font-display text-lg font-bold mt-1">{c.tenure} mo</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Status</div>
                  <div className="font-display text-lg font-bold mt-1" style={{ color: pct > 50 ? "var(--crimson)" : "var(--teal)" }}>
                    {pct > 50 ? "Will churn" : "Will stay"}
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel>
            <SectionLabel code="D2">Top risk drivers</SectionLabel>
            <div className="space-y-2">
              {result.drivers.map((d, i) => (
                <motion.div
                  key={d.label + i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3"
                >
                  <span className="font-mono text-[10px] text-muted-foreground w-5">{(i + 1).toString().padStart(2, "0")}</span>
                  <div className="flex-1 text-sm text-foreground">{d.label}</div>
                  <div className="w-24 h-1.5 bg-panel-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (Math.abs(d.impact) / 1.4) * 100)}%`,
                        background: d.impact > 0 ? "var(--crimson)" : "var(--teal)",
                      }}
                    />
                  </div>
                  <span className="font-mono text-xs w-12 text-right" style={{ color: d.impact > 0 ? "var(--crimson)" : "var(--teal)" }}>
                    {d.impact > 0 ? "+" : ""}{d.impact.toFixed(1)}
                  </span>
                </motion.div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-8">
        <SectionLabel code="D3">Retention playbook</SectionLabel>
        <div className="grid md:grid-cols-3 gap-3">
          {RISK_ACTIONS[result.band].map((action, i) => {
            const icons = [Phone, Gift, ShieldAlert];
            const Icon = icons[i] ?? Sparkles;
            const priority = ["URGENT", "HIGH", "STANDARD"][i] ?? "PLAN";
            return (
              <motion.div
                key={action}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="panel rounded-2xl p-5 border-l-2"
                style={{ borderLeftColor: color }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `color-mix(in oklab, ${color} 15%, transparent)`, color }}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[10px] tracking-widest" style={{ color }}>{priority}</span>
                </div>
                <p className="text-sm text-foreground">{action}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {!analyzed && (
        <div className="text-center mt-4 text-xs text-muted-foreground font-mono">
          ◌ Live mode — predictions update as you type
        </div>
      )}
    </>
  );
}