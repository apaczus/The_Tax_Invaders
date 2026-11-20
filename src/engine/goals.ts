// Warunki celów levelu. Teksty są w src/data/goals.json.
import { GOALS, INSURANCES, LEVELS } from "./content";
import { expensiveDebts, invested, nextRevenue, overdueSum, projection } from "./economy";
import { fmt } from "./format";
import type { GameState, GoalResult } from "./types";

interface GoalCheck {
  /** final = sprawdzenie po zamknięciu miesiąca; inaczej podgląd na żywo */
  check: (s: GameState, final: boolean) => boolean;
  detail: (s: GameState) => string;
}

export function missingInsurance(s: GameState): string[] {
  const req = ["firm_oc", "firm_prop", "home", "life"];
  if (s.profile.car === "private") req.push("ac");
  return req.filter((k) => !s.insurance[k]);
}

const cushion = (amount: number): GoalCheck => ({
  check: (s) => s.me.savings >= amount,
  detail: (s) => `Masz ${fmt(s.me.savings)} na koncie oszczędnościowym`,
});

const CHECKS: Record<string, GoalCheck> = {
  noOverdue: {
    check: (s) => s.overdue.length === 0,
    detail: (s) => (s.overdue.length ? `${s.overdue.length} do spłaty · ${fmt(overdueSum(s))}` : "Brak zaległości"),
  },
  noExpensive: {
    check: (s) => expensiveDebts(s).length === 0,
    detail: (s) => {
      const e = expensiveDebts(s);
      return e.length ? `${e.length} do spłaty · ${fmt(e.reduce((a, d) => a + d.balance, 0))}` : "Brak drogich długów";
    },
  },
  liquidity: {
    check: (s, final) => {
      if (final) return !s.month.flags.liquidityBroken;
      const p = projection(s);
      return p.firm >= 0 && p.me >= 0;
    },
    detail: (s) => {
      const p = projection(s);
      return `Prognoza: firma ${fmt(p.firm)} · Ty ${fmt(p.me)}`;
    },
  },
  separated: {
    check: (s) => s.separated,
    detail: (s) => (s.separated ? "Konta rozdzielone" : "Mieszane wydatki kosztują Cię 300 zł/mies. u księgowej"),
  },
  cushion2000: cushion(GOALS.cushion2000?.amount ?? 2000),
  cushion4000: cushion(GOALS.cushion4000?.amount ?? 4000),
  noNewDebt: {
    check: (s) => !s.month.flags.newDebt,
    detail: (s) =>
      s.month.flags.newDebt
        ? "Wziąłeś chwilówkę 😬"
        : s.month.eventDone
          ? "Bez nowych długów 👍"
          : "Coś się jeszcze wydarzy w tym miesiącu…",
  },
  revenue45: {
    check: (s) => nextRevenue(s) >= (GOALS.revenue45?.amount ?? 45000),
    detail: (s) => `Teraz: ${fmt(nextRevenue(s))}`,
  },
  firmBuffer: {
    check: (s, final) =>
      (final ? s.firm.cash : projection(s).firm) + s.firm.reserve >= (GOALS.firmBuffer?.amount ?? 2000) &&
      !(final && s.month.flags.firmNegative),
    detail: (s) => `Prognoza: ${fmt(projection(s).firm + s.firm.reserve)}`,
  },
  insured: {
    check: (s) => missingInsurance(s).length === 0,
    detail: (s) => {
      const m = missingInsurance(s);
      return m.length ? "Brakuje: " + m.map((k) => INSURANCES[k].name).join(", ") : "Wszystko zabezpieczone";
    },
  },
  invested3000: {
    check: (s) => invested(s) >= (GOALS.invested3000?.amount ?? 3000),
    detail: (s) => `Zainwestowane: ${fmt(invested(s))}`,
  },
  noPanic: {
    check: (s) => !s.month.flags.panicSold,
    detail: (s) => (s.month.flags.panicSold ? "Sprzedałeś ze stratą 😬" : "Spokojnie…"),
  },
};

export function levelGoalIds(s: GameState): string[] {
  const lv = LEVELS[s.level - 1];
  return lv.goals.filter((id) => !(GOALS[id]?.onlyIfNotSeparatedAtStart && s.separatedAtStart));
}

export function evaluateGoals(s: GameState, final = false): GoalResult[] {
  return levelGoalIds(s).map((id) => {
    const def = GOALS[id];
    const c = CHECKS[id];
    if (!def || !c) throw new Error(`Nieznany cel: ${id}`);
    return { id, label: def.label, why: def.why, fix: def.fix, ok: c.check(s, final), detail: c.detail(s) };
  });
}
