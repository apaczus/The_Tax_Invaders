// Czyste funkcje liczące finanse na podstawie stanu (bez mutacji).
import { ECON, INSURANCES, industryOf, LIFESTYLE_LABEL } from "./content";
import type { Debt, GameState, Owner } from "./types";

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

export function nextRevenue(s: GameState): number {
  const f = s.firm;
  return (
    ECON.firm.baseRevenue +
    (f.staff - ECON.firm.startStaff) * ECON.firm.staffRevenue +
    (f.equip ? ECON.firm.equipRevenue : 0) +
    f.marketingNext
  );
}

export function debtPayment(d: Debt): number {
  const interest = d.balance * d.rate;
  const min = d.minPayment === "card" ? Math.max(50, d.balance * 0.05) : d.minPayment;
  return Math.min(min, d.balance + interest);
}

export const expensiveDebts = (s: GameState) => s.debts.filter((d) => d.kind === "expensive" && d.balance > 0.5);
export const overdueSum = (s: GameState, owner?: Owner) =>
  sum(s.overdue.filter((o) => !owner || o.owner === owner).map((o) => o.amount));
export const invested = (s: GameState) => s.investments.bonds + s.investments.etf;

export type BillLine = [label: string, amount: number];
export interface Bills {
  firm: BillLine[];
  me: BillLine[];
  firmTotal: number;
  meTotal: number;
}

/** Rachunki do zapłacenia przy zamknięciu miesiąca. */
export function bills(s: GameState): Bills {
  const F = ECON.firm, P = ECON.personal;
  const f = s.firm, p = s.profile, I = industryOf(p.industry);
  const firm: BillLine[] = [];
  const me: BillLine[] = [];
  firm.push([`${I.variableCosts} (${Math.round(F.variableCostRate * 100)}% przychodu)`, f.revenueNow * F.variableCostRate]);
  firm.push([I.rent, F.rent]);
  firm.push(["Księgowość, media, oprogramowanie", F.otherCosts]);
  firm.push([`Wynagrodzenia (${f.staff} os.)`, f.staff * F.staffCost]);
  firm.push(["ZUS właściciela", F.ownerSocialSecurity]);
  if (p.car === "firm") firm.push(["Leasing auta firmowego + paliwo", F.firmCarCost]);
  if (f.leaseLeft > 0) firm.push(["Rata leasingu sprzętu", F.leaseRate]);
  if (!s.separated) firm.push(["Księgowa: dopłata za mieszane konta", F.mixedAccountsPenalty]);
  for (const [k, v] of Object.entries(INSURANCES)) if (v.owner === "firm" && s.insurance[k]) firm.push([`Ubezp.: ${v.name}`, v.cost]);
  for (const d of s.debts) if (d.owner === "firm" && d.balance > 0) firm.push([`Rata: ${d.name}`, debtPayment(d)]);
  const pre = sum(firm.map((x) => x[1]));
  firm.push([`Podatek dochodowy (uproszczony ${Math.round(F.taxRate * 100)}%)`, Math.max(0, f.revenueNow - pre) * F.taxRate]);

  const housingLabel: Record<string, string> = {
    rent: "Najem mieszkania",
    mortgage: "Czynsz i opłaty za mieszkanie",
    own: "Czynsz i opłaty za mieszkanie",
    family: "Dokładam się do domu",
  };
  if (p.housing) me.push([housingLabel[p.housing], P.housing[p.housing]]);
  me.push([`Życie: jedzenie, rachunki, rozrywka (${LIFESTYLE_LABEL[s.me.lifestyle].toLowerCase()})`, P.lifestyle[s.me.lifestyle]]);
  if (p.car === "private") me.push(["Auto: paliwo i serwis", P.carPrivateCost]);
  if (p.car === "none") me.push(["Komunikacja miejska", P.publicTransportCost]);
  for (const [k, v] of Object.entries(INSURANCES)) if (v.owner === "me" && s.insurance[k]) me.push([`Ubezp.: ${v.name}`, v.cost]);
  for (const d of s.debts) if (d.owner === "me" && d.balance > 0) me.push([`Rata: ${d.name}`, debtPayment(d)]);

  return { firm, me, firmTotal: sum(firm.map((x) => x[1])), meTotal: sum(me.map((x) => x[1])) };
}

/** Prognoza sald po zapłaceniu rachunków. */
export function projection(s: GameState) {
  const b = bills(s);
  return { firm: s.firm.cash - b.firmTotal, me: s.me.cash - b.meTotal, bills: b };
}

export function netWorth(s: GameState): number {
  return (
    s.firm.cash + s.firm.reserve + s.firm.receivable + s.me.cash + s.me.savings + invested(s) -
    sum(s.debts.filter((d) => d.kind !== "mortgage").map((d) => d.balance)) -
    overdueSum(s)
  );
}

export function firmStage(s: GameState) {
  const r = nextRevenue(s);
  const st = ECON.firmStages;
  let i = 0;
  st.forEach((x, j) => {
    if (r >= x.minRevenue) i = j;
  });
  const nxt = st[i + 1];
  const from = Math.max(st[i].minRevenue, i === 0 ? ECON.firm.baseRevenue : 0);
  const icon = industryOf(s.profile.industry).stageIcons[i] ?? "🏪";
  return {
    index: i,
    name: st[i].name,
    icon,
    next: nxt?.name ?? null,
    progress: nxt ? Math.max(0, Math.min(1, (r - from) / (nxt.minRevenue - from))) : 1,
  };
}

/** Najważniejsze liczby do panelu u góry. */
export function keyStats(s: GameState) {
  const pr = projection(s);
  return {
    firmCash: s.firm.cash,
    firmReserve: s.firm.reserve,
    firmIncome: s.firm.revenueNow,
    firmExpenses: pr.bills.firmTotal,
    firmForecast: pr.firm,
    firmOverdue: overdueSum(s, "firm"),
    meCash: s.me.cash,
    meSavings: s.me.savings,
    meIncome: s.me.salary,
    meExpenses: pr.bills.meTotal,
    meForecast: pr.me,
    meOverdue: overdueSum(s, "me"),
    debtTotal: sum(s.debts.filter((d) => d.kind !== "mortgage").map((d) => d.balance)),
    netWorth: netWorth(s),
  };
}
