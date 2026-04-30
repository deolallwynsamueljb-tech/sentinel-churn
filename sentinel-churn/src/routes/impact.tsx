import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { TrendingDown, DollarSign, Users, Calculator } from "lucide-react";
import { getDataset, datasetStats } from "@/lib/churn-engine";
import { Panel, PageHero, SectionLabel, Pill, StatTile } from "@/components/ui-bits";

export const Route = createFileRoute("/impact")({
  head: () => ({
    meta: [
      { title: "Business Impact — ChurnIQ" },
      { name: "description", content: "Revenue at risk, retention ROI calculator and high-risk segment cohort." },
    ],
  }),
  component: Impact,
});

const TT = {
  contentStyle: { background: "oklch(0.18 0.018 270)", border: "1px solid oklch(0.28 0.02 270)", borderRadius: 12, fontSize: 12 },
  itemStyle: { color: "oklch(0.95 0.01 80)" },
  labelStyle: { color: "oklch(0.62 0.02 270)", fontSize: 11 },
};

function Impact() {
  const rows = useMemo(() => getDataset(), []);
  const stats = useMemo(() => datasetStats(rows), [rows]);

  const [savePct, setSavePct] = useState(30);
  const [costPer, setCostPer] = useState(20);

  const savedCustomers = Math.round(stats.churned * (savePct / 100));
  const savedRevenue = savedCustomers * 70 * 24;
  const campaignCost = savedCustomers * costPer;
  const netRoi = savedRevenue - campaignCost;
  const roiPct = (netRoi / Math.max(campaignCost, 1)) * 100;

  // segment heatmap data — contract × payment churn rates
  const segments = useMemo(() => {
    const contracts = ["Month-to-month", "One year", "Two year"];
    const payments = ["Electronic check", "Mailed check", "Bank transfer", "Credit card"];
    return contracts.map((c) => ({
      contract: c,
      cells: payments.map((p) => {
        const slice = rows.filter((r) => r.contract === c && r.payment === p);
        const rate = slice.length ? (slice.filter((r) => r.churn).length / slice.length) * 100 : 0;
        return { payment: p, rate, n: slice.length };
      }),
    }));
  }, [rows]);

  const highRisk = useMemo(() =>
    rows.filter((r) => r.contract === "Month-to-month" && r.satisfaction <= 2 && r.supportTickets > 3),
  [rows]);

  const segmentChurn = useMemo(() => {
    const groups = [
      { label: "M2M + Low Sat", filter: (r: typeof rows[0]) => r.contract === "Month-to-month" && r.satisfaction <= 2 },
      { label: "Fiber + No Security", filter: (r: typeof rows[0]) => r.internet === "Fiber Optic" && r.onlineSecurity === "No" },
      { label: "E-check Payment", filter: (r: typeof rows[0]) => r.payment === "Electronic check" },
      { label: "Tickets > 3", filter: (r: typeof rows[0]) => r.supportTickets > 3 },
      { label: "New (< 6 mo)", filter: (r: typeof rows[0]) => r.tenure < 6 },
      { label: "Late Pay > 0", filter: (r: typeof rows[0]) => r.latePayments > 0 },
    ];
    return groups.map((g) => {
      const slice = rows.filter(g.filter);
      return { name: g.label, rate: +(slice.length ? (slice.filter((r) => r.churn).length / slice.length) * 100 : 0).toFixed(1), n: slice.length };
    }).sort((a, b) => b.rate - a.rate);
  }, [rows]);

  return (
    <>
      <PageHero
        kicker="Impact · Where churn meets revenue"
        title="Quantify the bleed. Plan the save."
        sub="Translate model probabilities into dollars, target the highest-leverage segments, and stress-test retention budgets in real time."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <StatTile label="Customers churned" value={stats.churned.toLocaleString()} sub={`${(stats.churnRate * 100).toFixed(1)}% of base`} accent="crimson" index={0} />
        <StatTile label="Monthly bleed" value={`$${(stats.monthlyLoss / 1000).toFixed(1)}K`} sub="Per month" accent="amber" index={1} />
        <StatTile label="Annual revenue loss" value={`$${(stats.annualLoss / 1000).toFixed(0)}K`} sub="ARPU × 12" accent="azure" index={2} />
        <StatTile label="24-month LTV lost" value={`$${(stats.ltvLoss / 1000).toFixed(0)}K`} sub="If unchecked" accent="teal" index={3} />
      </div>

      <SectionLabel code="E1">Risk segment leaderboard</SectionLabel>
      <Panel className="mb-10">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={segmentChurn} layout="vertical">
            <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
            <YAxis dataKey="name" type="category" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={150} />
            <Tooltip {...TT} formatter={(v: number) => [`${v}%`, "Churn rate"]} />
            <Bar dataKey="rate" radius={[0, 8, 8, 0]}>
              {segmentChurn.map((d, i) => (
                <Cell key={i} fill={d.rate > 50 ? "var(--crimson)" : d.rate > 30 ? "var(--amber)" : "var(--teal)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <SectionLabel code="E2">Contract × Payment heatmap</SectionLabel>
      <Panel className="mb-10 overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-[160px_repeat(4,1fr)] gap-2 mb-2">
            <div />
            {segments[0].cells.map((c) => (
              <div key={c.payment} className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground text-center">{c.payment}</div>
            ))}
          </div>
          {segments.map((row) => (
            <div key={row.contract} className="grid grid-cols-[160px_repeat(4,1fr)] gap-2 mb-2">
              <div className="text-sm text-foreground font-medium flex items-center">{row.contract}</div>
              {row.cells.map((c) => {
                const intensity = c.rate / 70; // normalize
                return (
                  <motion.div
                    key={c.payment}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-lg p-3 text-center border border-hairline"
                    style={{
                      background: `color-mix(in oklab, var(--crimson) ${Math.min(intensity * 100, 80)}%, var(--panel-2))`,
                    }}
                  >
                    <div className="font-display text-lg font-bold text-foreground">{c.rate.toFixed(0)}%</div>
                    <div className="text-[10px] font-mono text-muted-foreground">n={c.n}</div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </Panel>

      <SectionLabel code="E3">Retention ROI calculator</SectionLabel>
      <Panel className="mb-10 bg-gradient-to-br from-teal/8 via-panel to-panel border-teal/30">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">% of at-risk we retain</label>
                <span className="font-display text-2xl font-bold text-teal">{savePct}%</span>
              </div>
              <input
                type="range" min={5} max={80} step={5} value={savePct}
                onChange={(e) => setSavePct(Number(e.target.value))}
                className="w-full accent-teal"
              />
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Cost per retention contact</label>
                <span className="font-display text-2xl font-bold text-amber">${costPer}</span>
              </div>
              <input
                type="range" min={5} max={100} step={5} value={costPer}
                onChange={(e) => setCostPer(Number(e.target.value))}
                className="w-full accent-amber"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="rounded-xl bg-panel-2 border border-hairline p-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3" /> Saved</div>
                <div className="font-display text-xl font-bold mt-1">{savedCustomers.toLocaleString()}</div>
              </div>
              <div className="rounded-xl bg-panel-2 border border-hairline p-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Calculator className="h-3 w-3" /> Campaign</div>
                <div className="font-display text-xl font-bold mt-1">${(campaignCost / 1000).toFixed(1)}K</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Net retention ROI</div>
            <motion.div
              key={netRoi}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="font-display text-6xl font-extrabold mt-2 text-teal"
              style={{ textShadow: "0 0 40px color-mix(in oklab, var(--teal) 40%, transparent)" }}
            >
              ${(netRoi / 1000).toFixed(0)}K
            </motion.div>
            <div className="text-sm text-muted-foreground mt-2">
              <span className="text-teal font-mono">{roiPct.toFixed(0)}%</span> return · ${(savedRevenue / 1000).toFixed(0)}K LTV recovered
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs">
              <DollarSign className="h-4 w-4 text-amber" />
              <span className="text-muted-foreground">Calculation: saved × $70 ARPU × 24 months − campaign cost</span>
            </div>
          </div>
        </div>
      </Panel>

      <SectionLabel code="E4">Critical-risk cohort</SectionLabel>
      <Panel>
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-crimson" />
              {highRisk.length.toLocaleString()} customers match all 3 critical signals
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Month-to-month + low satisfaction + 3+ tickets</p>
          </div>
          <Pill color="crimson">
            {((highRisk.filter((r) => r.churn).length / Math.max(highRisk.length, 1)) * 100).toFixed(1)}% churn vs {(stats.churnRate * 100).toFixed(1)}% baseline
          </Pill>
        </div>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-hairline">
                <th className="text-left p-2">ID</th>
                <th className="text-right p-2">Tenure</th>
                <th className="text-right p-2">Monthly $</th>
                <th className="text-left p-2">Contract</th>
                <th className="text-right p-2">Sat</th>
                <th className="text-right p-2">Tickets</th>
                <th className="text-right p-2">Risk</th>
              </tr>
            </thead>
            <tbody>
              {highRisk.slice(0, 10).map((r) => (
                <tr key={r.id} className="border-b border-hairline/50 hover:bg-panel-2/50 transition">
                  <td className="p-2 font-mono text-xs text-muted-foreground">{r.id}</td>
                  <td className="p-2 text-right font-mono">{r.tenure} mo</td>
                  <td className="p-2 text-right font-mono">${r.monthlyCharges.toFixed(0)}</td>
                  <td className="p-2 text-xs">{r.contract}</td>
                  <td className="p-2 text-right">
                    <span className="text-crimson font-mono">{r.satisfaction}/5</span>
                  </td>
                  <td className="p-2 text-right font-mono">{r.supportTickets}</td>
                  <td className="p-2 text-right">
                    <span className="font-mono font-bold" style={{ color: r.probability > 0.7 ? "var(--crimson)" : "var(--amber)" }}>
                      {(r.probability * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}