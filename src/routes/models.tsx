import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Trophy, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, Legend,
} from "recharts";
import { MODEL_METRICS, FEATURE_IMPORTANCE, CV_SCORES, rocPoints } from "@/lib/churn-engine";
import { Panel, PageHero, SectionLabel, Pill, StatTile } from "@/components/ui-bits";

export const Route = createFileRoute("/models")({
  head: () => ({
    meta: [
      { title: "AI Models — ChurnIQ" },
      { name: "description", content: "Model comparison, ROC curves, feature importance and 5-fold CV diagnostics." },
    ],
  }),
  component: Models,
});

const TT = {
  contentStyle: { background: "oklch(0.18 0.018 270)", border: "1px solid oklch(0.28 0.02 270)", borderRadius: 12, fontSize: 12 },
  itemStyle: { color: "oklch(0.95 0.01 80)" },
  labelStyle: { color: "oklch(0.62 0.02 270)", fontSize: 11 },
};

function Models() {
  const best = MODEL_METRICS.find((m) => m.best)!;
  const cvMean = CV_SCORES.reduce((a, b) => a + b, 0) / CV_SCORES.length;
  const cvStd = Math.sqrt(CV_SCORES.reduce((a, b) => a + (b - cvMean) ** 2, 0) / CV_SCORES.length);

  const rocData = (() => {
    const lr = rocPoints(0.812);
    const rf = rocPoints(0.901);
    const gb = rocPoints(0.934);
    return lr.map((p, i) => ({ fpr: p.fpr, lr: p.tpr, rf: rf[i].tpr, gb: gb[i].tpr }));
  })();

  return (
    <>
      <PageHero
        kicker="Models · Trained on SMOTE-balanced cohort"
        title="Three classifiers. One winner."
        sub="Logistic Regression for the baseline, Random Forest for the ensemble lift, Gradient Boosting for the trophy. All evaluated on a held-out 1,000-customer test set."
      />

      <SectionLabel code="C1">Leaderboard</SectionLabel>
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {MODEL_METRICS.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`relative panel rounded-2xl p-6 ${m.best ? "border-crimson/50 glow-crimson" : ""}`}
          >
            {m.best && (
              <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-crimson text-primary-foreground text-[10px] font-mono uppercase tracking-widest">
                <Trophy className="h-3 w-3" /> Best
              </div>
            )}
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{`Model ${i + 1}`}</div>
            <h3 className="font-display text-xl font-bold mt-1">{m.name}</h3>
            <div className="mt-5">
              <div className="font-display text-5xl font-extrabold" style={{ color: m.best ? "var(--crimson)" : "var(--foreground)", textShadow: m.best ? "0 0 30px color-mix(in oklab, var(--crimson) 40%, transparent)" : "none" }}>
                {m.auc.toFixed(3)}
              </div>
              <div className="text-xs font-mono text-muted-foreground tracking-widest uppercase">ROC-AUC</div>
            </div>
            <div className="mt-5 space-y-2 text-sm">
              {[
                ["Recall", m.recall], ["Precision", m.precision], ["F1", m.f1], ["Accuracy", m.accuracy], ["FN rate", m.fnRate],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-foreground">{(v as number).toFixed(3)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <Panel className="mb-10 bg-amber/5 border-amber/30">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-display font-bold text-amber">Recall &gt; Accuracy.</span>{" "}
            <span className="text-muted-foreground">Each missed churner is worth ~$1,680 in lost LTV. We tune for sensitivity, not precision.</span>
          </div>
        </div>
      </Panel>

      <SectionLabel code="C2">ROC curves</SectionLabel>
      <Panel className="mb-10">
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={rocData}>
            <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" />
            <XAxis dataKey="fpr" type="number" domain={[0, 1]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "False Positive Rate", position: "bottom", offset: -5, fill: "var(--muted-foreground)", fontSize: 11 }} />
            <YAxis domain={[0, 1]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "True Positive Rate", angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 11 }} />
            <Tooltip {...TT} />
            <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }} />
            <Line type="monotone" dataKey="lr" stroke="var(--azure)" strokeWidth={2} dot={false} name="Logistic Reg (0.812)" />
            <Line type="monotone" dataKey="rf" stroke="var(--amber)" strokeWidth={2} dot={false} name="Random Forest (0.901)" />
            <Line type="monotone" dataKey="gb" stroke="var(--crimson)" strokeWidth={3} dot={false} name="Gradient Boost (0.934)" />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <SectionLabel code="C3">Feature importance — Random Forest</SectionLabel>
      <Panel className="mb-10">
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={[...FEATURE_IMPORTANCE].reverse()} layout="vertical">
            <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="feature" type="category" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={150} />
            <Tooltip {...TT} />
            <Bar dataKey="importance" radius={[0, 8, 8, 0]}>
              {[...FEATURE_IMPORTANCE].reverse().map((d, i, arr) => (
                <Cell key={i} fill={i >= arr.length - 3 ? "var(--crimson)" : "var(--azure)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <SectionLabel code="C4">Cross-validation (5-fold)</SectionLabel>
      <Panel className="bg-gradient-to-br from-teal/8 to-panel border-teal/30">
        <div className="grid md:grid-cols-[auto_1fr] gap-8 items-center">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Random Forest CV</div>
            <div className="font-display text-5xl font-extrabold mt-2" style={{ color: "var(--teal)", textShadow: "0 0 30px color-mix(in oklab, var(--teal) 40%, transparent)" }}>
              {cvMean.toFixed(4)}
            </div>
            <div className="text-xs font-mono text-muted-foreground mt-1">± {cvStd.toFixed(4)} std</div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {CV_SCORES.map((s, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-panel-2 border border-hairline">
                <div className="text-[10px] font-mono text-muted-foreground">FOLD {i + 1}</div>
                <div className="font-display text-lg font-bold text-foreground mt-1">{s.toFixed(3)}</div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </>
  );
}