import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ScatterChart, Scatter, ZAxis } from "recharts";
import { getDataset } from "@/lib/churn-engine";
import { Panel, PageHero, SectionLabel, Pill, StatTile } from "@/components/ui-bits";

export const Route = createFileRoute("/data-lab")({
  head: () => ({
    meta: [
      { title: "Data Lab — ChurnIQ" },
      { name: "description", content: "Distributions, correlations and missing-value diagnostics across the churn dataset." },
    ],
  }),
  component: DataLab,
});

const TT = {
  contentStyle: { background: "oklch(0.18 0.018 270)", border: "1px solid oklch(0.28 0.02 270)", borderRadius: 12, fontSize: 12 },
  itemStyle: { color: "oklch(0.95 0.01 80)" },
  labelStyle: { color: "oklch(0.62 0.02 270)", fontSize: 11 },
};

function DataLab() {
  const rows = useMemo(() => getDataset(), []);

  const satData = useMemo(() => {
    return [1, 2, 3, 4, 5].map((s) => {
      const slice = rows.filter((r) => r.satisfaction === s);
      return { score: `${s}★`, rate: slice.length ? +((slice.filter((r) => r.churn).length / slice.length) * 100).toFixed(1) : 0 };
    });
  }, [rows]);

  const paymentData = useMemo(() => {
    const map = new Map<string, { total: number; churned: number }>();
    rows.forEach((r) => {
      const x = map.get(r.payment) ?? { total: 0, churned: 0 };
      x.total++; if (r.churn) x.churned++;
      map.set(r.payment, x);
    });
    return Array.from(map).map(([name, v]) => ({ name, rate: +((v.churned / v.total) * 100).toFixed(1) }));
  }, [rows]);

  const ticketsData = useMemo(() => {
    const buckets = [0, 1, 2, 3, 4, 5, 6, 8, 12];
    return buckets.slice(0, -1).map((b, i) => {
      const slice = rows.filter((r) => r.supportTickets >= b && r.supportTickets < buckets[i + 1]);
      return { bucket: `${b}-${buckets[i + 1] - 1}`, rate: slice.length ? +((slice.filter((r) => r.churn).length / slice.length) * 100).toFixed(1) : 0 };
    });
  }, [rows]);

  const scatter = useMemo(() => rows.slice(0, 800).map((r) => ({
    x: r.tenure, y: r.monthlyCharges, fill: r.churn ? "var(--crimson)" : "var(--teal)",
  })), [rows]);

  return (
    <>
      <PageHero
        kicker="Lab · Diagnostics"
        title="The data, dissected."
        sub="Five thousand customers, twenty engineered features, three percent injected nulls handled — what the model actually sees."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <StatTile label="Rows × cols" value="5,000 × 20" sub="Post-engineering" accent="azure" index={0} />
        <StatTile label="Missing cells" value="1.8%" sub="Median + mode imputed" accent="amber" index={1} />
        <StatTile label="Imbalance ratio" value="2.85 : 1" sub="Resolved with SMOTE" accent="crimson" index={2} />
        <StatTile label="Data quality" value="98.2 / 100" sub="After cleaning" accent="teal" index={3} />
      </div>

      <SectionLabel code="B1">Satisfaction → churn</SectionLabel>
      <div className="grid lg:grid-cols-2 gap-4 mb-10">
        <Panel>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="font-display text-lg font-semibold">Churn rate by satisfaction</h3>
            <Pill color="teal">Strongest signal</Pill>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={satData}>
              <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="score" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip {...TT} />
              <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                {satData.map((d, i) => (
                  <Cell key={i} fill={d.rate > 40 ? "var(--crimson)" : d.rate > 20 ? "var(--amber)" : "var(--teal)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="font-display text-lg font-semibold">Churn by payment method</h3>
            <Pill color="amber">Friction signal</Pill>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={paymentData} layout="vertical">
              <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip {...TT} />
              <Bar dataKey="rate" radius={[0, 8, 8, 0]} fill="var(--crimson)" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <SectionLabel code="B2">Support burden</SectionLabel>
      <Panel className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-display text-lg font-semibold">Churn rate vs support tickets</h3>
          <Pill color="crimson">Threshold @ 3+</Pill>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={ticketsData}>
            <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="bucket" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip {...TT} />
            <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
              {ticketsData.map((d, i) => (
                <Cell key={i} fill={d.rate > 50 ? "var(--crimson)" : d.rate > 25 ? "var(--amber)" : "var(--teal)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <SectionLabel code="B3">Tenure × spend topology</SectionLabel>
      <Panel>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-display text-lg font-semibold">Customer cluster map (n=800 sample)</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-crimson" /><span className="text-muted-foreground">Churned</span></span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-teal" /><span className="text-muted-foreground">Retained</span></span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart>
            <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" name="Tenure" unit=" mo" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="number" dataKey="y" name="Monthly $" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <ZAxis range={[20, 20]} />
            <Tooltip {...TT} cursor={{ strokeDasharray: "3 3", stroke: "var(--hairline)" }} />
            <Scatter data={scatter} shape="circle">
              {scatter.map((p, i) => <Cell key={i} fill={p.fill} fillOpacity={0.55} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </Panel>
    </>
  );
}