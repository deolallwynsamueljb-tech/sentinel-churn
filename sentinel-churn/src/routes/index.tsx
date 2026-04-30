import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, AlertTriangle, Sparkles, Activity } from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid,
} from "recharts";
import { getDataset, datasetStats, MODEL_METRICS } from "@/lib/churn-engine";
import { StatTile, SectionLabel, Panel, Pill, PageHero } from "@/components/ui-bits";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChurnIQ · Overview — Customer Intelligence" },
      { name: "description", content: "Real-time churn landscape, model performance and revenue-at-risk dashboard." },
    ],
  }),
  component: Overview,
});

const TOOLTIP_STYLE = {
  contentStyle: { background: "oklch(0.18 0.018 270)", border: "1px solid oklch(0.28 0.02 270)", borderRadius: 12, fontSize: 12 },
  itemStyle: { color: "oklch(0.95 0.01 80)" },
  labelStyle: { color: "oklch(0.62 0.02 270)", fontSize: 11 },
};

function Overview() {
  const rows = useMemo(() => getDataset(), []);
  const stats = useMemo(() => datasetStats(rows), [rows]);
  const best = MODEL_METRICS.find((m) => m.best)!;

  const pieData = [
    { name: "Retained", value: stats.retained, color: "var(--teal)" },
    { name: "Churned", value: stats.churned, color: "var(--crimson)" },
  ];

  const contractData = useMemo(() => {
    const groups = new Map<string, { total: number; churned: number }>();
    rows.forEach((r) => {
      const g = groups.get(r.contract) ?? { total: 0, churned: 0 };
      g.total++; if (r.churn) g.churned++;
      groups.set(r.contract, g);
    });
    return Array.from(groups.entries()).map(([name, v]) => ({
      name, rate: +((v.churned / v.total) * 100).toFixed(1),
    }));
  }, [rows]);

  const tenureData = useMemo(() => {
    const buckets = [0, 6, 12, 24, 36, 48, 72];
    return buckets.slice(0, -1).map((b, i) => {
      const slice = rows.filter((r) => r.tenure >= b && r.tenure < buckets[i + 1]);
      return {
        bucket: `${b}-${buckets[i + 1]}`,
        churnRate: slice.length ? +((slice.filter((r) => r.churn).length / slice.length) * 100).toFixed(1) : 0,
      };
    });
  }, [rows]);

  return (
    <>
      <PageHero
        kicker="Week 02 · Classification · Engineered by Deol A.S"
        title="The churn landscape, reframed."
        sub="ChurnIQ unites 5,000 customers, three trained ML models and live business impact telemetry into a single command surface — built for retention teams, validated for hackathons."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <StatTile label="Total customers" value={stats.total.toLocaleString()} sub="Synthesised cohort" accent="azure" index={0} />
        <StatTile label="Churn rate" value={`${(stats.churnRate * 100).toFixed(1)}%`} sub={`${stats.churned.toLocaleString()} customers lost`} accent="crimson" index={1} />
        <StatTile label="Best ROC-AUC" value={best.auc.toFixed(3)} sub={best.name} accent="teal" index={2} />
        <StatTile label="Annual revenue at risk" value={`$${(stats.annualLoss / 1000).toFixed(0)}K`} sub="Lost ARPU × 12" accent="amber" index={3} />
      </div>

      <SectionLabel code="A1">Customer split</SectionLabel>
      <div className="grid lg:grid-cols-2 gap-4 mb-10">
        <Panel>
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">Retained vs churned</h3>
            <Pill color="teal">SMOTE balanced</Pill>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={2}>
                {pieData.map((d) => <Cell key={d.name} fill={d.color} stroke="var(--obsidian)" strokeWidth={3} />)}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 -mt-4">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-mono text-foreground">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">Churn by contract</h3>
            <Pill color="crimson">Highest-risk lever</Pill>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={contractData}>
              <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                {contractData.map((d, i) => (
                  <Cell key={i} fill={d.rate > 30 ? "var(--crimson)" : d.rate > 15 ? "var(--amber)" : "var(--teal)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <SectionLabel code="A2">Risk concentration</SectionLabel>
      <Panel className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-semibold">Churn rate by customer tenure</h3>
            <p className="text-xs text-muted-foreground mt-1">Newest customers are 4× more likely to leave — retention windows close fast.</p>
          </div>
          <Pill color="amber">Curve insight</Pill>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={tenureData}>
            <defs>
              <linearGradient id="tenureGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--crimson)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--crimson)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="bucket" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip {...TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="churnRate" stroke="var(--crimson)" strokeWidth={2.5} fill="url(#tenureGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <SectionLabel code="A3">Critical insights</SectionLabel>
      <div className="grid md:grid-cols-3 gap-3 mb-10">
        {[
          { icon: AlertTriangle, color: "crimson", title: "Month-to-month is the killer", body: `${contractData.find(c=>c.name==="Month-to-month")?.rate}% churn vs ${contractData.find(c=>c.name==="Two year")?.rate}% on 2-yr contracts.` },
          { icon: Activity, color: "amber", title: "Tickets > 3 = red flag", body: "Customers with 3+ support tickets churn at nearly double the base rate." },
          { icon: Sparkles, color: "teal", title: "Retention pays back fast", body: `Saving 30% of at-risk customers recovers ~$${(stats.churned*0.3*70*24/1000).toFixed(0)}K LTV.` },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className="panel rounded-2xl p-5"
            >
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl mb-3`}
                   style={{ background: `color-mix(in oklab, var(--${c.color}) 15%, transparent)`, color: `var(--${c.color})` }}>
                <Icon className="h-4 w-4" />
              </div>
              <h4 className="font-display font-semibold text-foreground">{c.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{c.body}</p>
            </motion.div>
          );
        })}
      </div>

      <Panel className="bg-gradient-to-br from-crimson/10 via-panel to-panel border-crimson/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <Pill color="crimson">Action</Pill>
            <h3 className="font-display text-2xl font-bold mt-3">Predict a single customer's churn risk</h3>
            <p className="text-muted-foreground mt-1 text-sm">Run any profile through the Gradient Boosting model with confidence bands and retention plays.</p>
          </div>
          <Link to="/predict" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-crimson text-primary-foreground font-display font-semibold hover:bg-crimson-glow transition glow-crimson">
            Open predictor <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Panel>
    </>
  );
}