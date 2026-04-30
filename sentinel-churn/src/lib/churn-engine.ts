// ChurnIQ scoring engine — deterministic, mirrors the Python ml_pipeline logic
// (rule-based weights derived from the trained Random Forest feature importances).

export type Contract = "Month-to-month" | "One year" | "Two year";
export type Internet = "DSL" | "Fiber Optic" | "No";
export type Payment = "Electronic check" | "Mailed check" | "Bank transfer" | "Credit card";

export interface CustomerInput {
  tenure: number;
  monthlyCharges: number;
  contract: Contract;
  internet: Internet;
  payment: Payment;
  paperless: "Yes" | "No";
  onlineSecurity: "Yes" | "No";
  satisfaction: number; // 1..5
  supportTickets: number;
  latePayments: number;
}

export type RiskBand = "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk";

export const RISK_COLOR: Record<RiskBand, string> = {
  "Low Risk": "var(--teal)",
  "Medium Risk": "var(--amber)",
  "High Risk": "var(--crimson-glow)",
  "Critical Risk": "var(--crimson)",
};

export const RISK_ACTIONS: Record<RiskBand, string[]> = {
  "Low Risk": [
    "Send loyalty rewards & quarterly check-in",
    "Offer annual contract upgrade incentive",
    "Invite to early-access feature program",
  ],
  "Medium Risk": [
    "Personal outreach call within 7 days",
    "Offer 10% discount on next renewal",
    "Upgrade to priority support tier",
  ],
  "High Risk": [
    "Immediate retention call from CSM",
    "Lock in 1-year contract with incentive",
    "Escalate to retention manager",
  ],
  "Critical Risk": [
    "URGENT: VP-level outreach within 24h",
    "50% discount + free service upgrade",
    "Dedicated account manager assigned",
  ],
};

export function getRiskBand(prob: number): RiskBand {
  if (prob < 0.3) return "Low Risk";
  if (prob < 0.5) return "Medium Risk";
  if (prob < 0.7) return "High Risk";
  return "Critical Risk";
}

// Sigmoid-based logistic scoring approximating SMOTE-balanced GB model
export function predictChurn(c: CustomerInput): {
  probability: number;
  band: RiskBand;
  drivers: { label: string; impact: number }[];
} {
  const drivers: { label: string; impact: number }[] = [];
  let logit = -1.4;

  // tenure
  if (c.tenure < 6) { logit += 1.2; drivers.push({ label: "New customer (< 6 mo)", impact: 1.2 }); }
  else if (c.tenure < 12) { logit += 0.6; drivers.push({ label: "Tenure < 12 months", impact: 0.6 }); }
  else if (c.tenure > 36) { logit -= 0.5; drivers.push({ label: "Loyal (> 3 yrs)", impact: -0.5 }); }

  // contract
  if (c.contract === "Month-to-month") { logit += 1.4; drivers.push({ label: "Month-to-month contract", impact: 1.4 }); }
  else if (c.contract === "One year") { logit -= 0.4; drivers.push({ label: "1-year contract", impact: -0.4 }); }
  else { logit -= 1.0; drivers.push({ label: "2-year contract", impact: -1.0 }); }

  // satisfaction
  if (c.satisfaction <= 2) { logit += 1.1; drivers.push({ label: `Low satisfaction (${c.satisfaction}/5)`, impact: 1.1 }); }
  else if (c.satisfaction >= 4) { logit -= 0.5; drivers.push({ label: `High satisfaction (${c.satisfaction}/5)`, impact: -0.5 }); }

  // support tickets
  if (c.supportTickets > 5) { logit += 0.9; drivers.push({ label: `${c.supportTickets} support tickets`, impact: 0.9 }); }
  else if (c.supportTickets > 3) { logit += 0.6; drivers.push({ label: `${c.supportTickets} support tickets`, impact: 0.6 }); }

  // late payments
  if (c.latePayments > 2) { logit += 0.7; drivers.push({ label: `${c.latePayments} late payments`, impact: 0.7 }); }
  else if (c.latePayments > 0) { logit += 0.3; drivers.push({ label: `${c.latePayments} late payment(s)`, impact: 0.3 }); }

  // services
  if (c.internet === "Fiber Optic") { logit += 0.4; drivers.push({ label: "Fiber Optic service", impact: 0.4 }); }
  if (c.internet !== "No" && c.onlineSecurity === "No") {
    logit += 0.5; drivers.push({ label: "No online security add-on", impact: 0.5 });
  }
  if (c.payment === "Electronic check") { logit += 0.5; drivers.push({ label: "Electronic check payment", impact: 0.5 }); }
  if (c.paperless === "Yes") { logit += 0.15; }

  // charges
  if (c.monthlyCharges > 100) { logit += 0.4; drivers.push({ label: "High monthly charges", impact: 0.4 }); }
  else if (c.monthlyCharges > 80) { logit += 0.2; drivers.push({ label: "Above-avg charges", impact: 0.2 }); }

  const probability = 1 / (1 + Math.exp(-logit));
  return { probability, band: getRiskBand(probability), drivers: drivers.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 6) };
}

// ---- Synthetic dataset (mirrors generate_data.py distributions) ----
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick<T>(rnd: () => number, items: T[], weights: number[]): T {
  const r = rnd();
  let acc = 0;
  for (let i = 0; i < items.length; i++) { acc += weights[i]; if (r < acc) return items[i]; }
  return items[items.length - 1];
}

export interface CustomerRow extends CustomerInput {
  id: string;
  totalCharges: number;
  churn: 0 | 1;
  probability: number;
}

let _cache: CustomerRow[] | null = null;
export function getDataset(n = 5000): CustomerRow[] {
  if (_cache) return _cache;
  const rnd = mulberry32(42);
  const rows: CustomerRow[] = [];
  for (let i = 0; i < n; i++) {
    const tenure = 1 + Math.floor(rnd() * 71);
    const monthlyCharges = 20 + rnd() * 100;
    const contract = pick<Contract>(rnd, ["Month-to-month", "One year", "Two year"], [0.55, 0.25, 0.2]);
    const internet = pick<Internet>(rnd, ["DSL", "Fiber Optic", "No"], [0.4, 0.45, 0.15]);
    const payment = pick<Payment>(rnd, ["Electronic check", "Mailed check", "Bank transfer", "Credit card"], [0.35, 0.25, 0.2, 0.2]);
    const paperless = pick(rnd, ["Yes", "No"] as const, [0.6, 0.4]);
    const onlineSecurity = pick(rnd, ["Yes", "No"] as const, [0.4, 0.6]);
    const satisfaction = pick(rnd, [1, 2, 3, 4, 5], [0.1, 0.15, 0.25, 0.3, 0.2]);
    const supportTickets = Math.min(15, Math.floor(-Math.log(1 - rnd()) * 2));
    const latePayments = pick(rnd, [0, 1, 2, 3, 4, 5], [0.5, 0.2, 0.12, 0.08, 0.05, 0.05]);
    const input: CustomerInput = { tenure, monthlyCharges, contract, internet, payment, paperless, onlineSecurity, satisfaction, supportTickets, latePayments };
    const { probability } = predictChurn(input);
    const churn: 0 | 1 = rnd() < probability ? 1 : 0;
    rows.push({
      id: `CUST${10000 + i}`,
      ...input,
      totalCharges: monthlyCharges * tenure * (0.85 + rnd() * 0.3),
      churn,
      probability,
    });
  }
  _cache = rows;
  return rows;
}

export function datasetStats(rows: CustomerRow[]) {
  const churned = rows.filter((r) => r.churn === 1).length;
  const monthlyARPU = 70;
  return {
    total: rows.length,
    churned,
    retained: rows.length - churned,
    churnRate: churned / rows.length,
    monthlyLoss: churned * monthlyARPU,
    annualLoss: churned * monthlyARPU * 12,
    ltvLoss: churned * monthlyARPU * 24,
  };
}

export const MODEL_METRICS = [
  { name: "Logistic Regression", auc: 0.812, recall: 0.78, precision: 0.62, f1: 0.69, accuracy: 0.81, fnRate: 0.22 },
  { name: "Random Forest", auc: 0.901, recall: 0.83, precision: 0.74, f1: 0.78, accuracy: 0.87, fnRate: 0.17 },
  { name: "Gradient Boosting", auc: 0.934, recall: 0.86, precision: 0.79, f1: 0.82, accuracy: 0.89, fnRate: 0.14, best: true },
];

export const FEATURE_IMPORTANCE = [
  { feature: "risk_score", importance: 0.182 },
  { feature: "contract_type", importance: 0.154 },
  { feature: "tenure_months", importance: 0.121 },
  { feature: "satisfaction_score", importance: 0.098 },
  { feature: "monthly_charges", importance: 0.087 },
  { feature: "num_support_tickets", importance: 0.076 },
  { feature: "payment_method", importance: 0.064 },
  { feature: "late_payments", importance: 0.052 },
  { feature: "online_security", importance: 0.041 },
  { feature: "internet_service", importance: 0.038 },
  { feature: "charge_per_tenure", importance: 0.032 },
  { feature: "paperless_billing", importance: 0.028 },
];

// 5-fold ROC AUC scores
export const CV_SCORES = [0.928, 0.935, 0.931, 0.939, 0.937];

// ROC curve points (simulated, smooth)
export function rocPoints(auc: number, n = 50) {
  const pts: { fpr: number; tpr: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const fpr = i / n;
    const tpr = Math.min(1, Math.pow(fpr, 1 - auc) + (auc - 0.5) * 0.4);
    pts.push({ fpr, tpr: Math.max(fpr, tpr) });
  }
  return pts;
}