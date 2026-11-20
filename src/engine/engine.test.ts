import { describe, expect, it } from "vitest";
import {
  applyOperation,
  availableOperations,
  beginMonth,
  closeMonth,
  createGame,
  emptyProfile,
  evaluateGoals,
  expensiveDebts,
  nextLevel,
  projection,
  resolveEvent,
  retryLevel,
  triggerEvent,
  type GameState,
  type Profile,
} from "./index";

const worstCase: Profile = {
  ...emptyProfile(),
  name: "Ania",
  firmName: "Bistro",
  industry: "gastro",
  firmAge: "lt1",
  housing: "rent",
  car: "private",
  insurances: ["none"],
  debts: ["karta", "chwilowka", "debet", "gotowkowy", "raty0", "firmowy", "rachunki"],
  cushion: "none",
  separated: "no",
};

function ok(r: { state: GameState; error?: string }) {
  expect(r.error).toBeUndefined();
  return r.state;
}

/** Rozwiązuje ewentualne zdarzenie najbezpieczniejszą drogą. */
function handleEvent(s: GameState): GameState {
  if (s.phase !== "event") return s;
  const ev = s.month.event!;
  if (ev.toPay > 0) {
    if (s.me.cash < ev.toPay) s = ok(applyOperationAnyPhase(s, ev.toPay));
    return ok(resolveEvent(s, { kind: "cost", source: "me" }));
  }
  return ok(resolveEvent(s, { kind: "info" }));
}
// w fazie "event" operacje są zablokowane – w testach dopłacamy bezpośrednio
function applyOperationAnyPhase(s: GameState, amount: number) {
  const st = { ...s, phase: "play" as const };
  const r = applyOperation(st, { op: "transfer", direction: "firmToMe", amount });
  return { ...r, state: { ...r.state, phase: "event" as const, month: { ...r.state.month, event: s.month.event } } };
}

describe("onboarding -> stan startowy", () => {
  it("buduje firmę z branży i długi z ankiety", () => {
    const s = createGame(worstCase, 42);
    expect(s.level).toBe(1);
    expect(s.phase).toBe("brief");
    expect(s.debts.map((d) => d.key)).toContain("chwilowka");
    expect(s.overdue.length).toBe(3);
    expect(s.insurance.oc_auto).toBe(true);
    expect(s.insurance.ac).toBe(false);
    expect(s.firm.cash).toBe(5000 + 40000 - 7000);
    expect(s.me.cash).toBe(1200 + 7000);
  });

  it("level 1 ma tylko podstawowe operacje", () => {
    const s = createGame(worstCase, 1);
    const ids = availableOperations(s).map((o) => o.id);
    expect(ids).toContain("pay");
    expect(ids).not.toContain("hire");
  });
});

describe("level 1 – porządki w długach", () => {
  it("bez działań = porażka z wyjaśnieniem i powtórka levelu", () => {
    let s = beginMonth(createGame(worstCase, 7));
    s = closeMonth(s);
    expect(s.phase).toBe("result");
    expect(s.result!.pass).toBe(false);
    const failed = s.result!.goals.filter((g) => !g.ok).map((g) => g.id);
    expect(failed).toEqual(expect.arrayContaining(["noOverdue", "noExpensive", "separated"]));
    s = retryLevel(s);
    expect(s.level).toBe(1);
    expect(s.month.attempt).toBe(2);
    expect(s.lastFails!.length).toBeGreaterThan(0);
    expect(s.phase).toBe("brief");
  });

  it("dobra strategia przechodzi level 1 (najgorszy profil), z losowym zdarzeniem", () => {
    let s = beginMonth(createGame(worstCase, 123));
    s = ok(applyOperation(s, { op: "separate" }));
    for (const o of [...s.overdue]) {
      if (o.owner === "me" && s.me.cash < o.amount) s = ok(applyOperation(s, { op: "transfer", direction: "firmToMe", amount: o.amount }));
      s = handleEvent(s);
      s = ok(applyOperation(s, { op: "pay", target: { type: "overdue", id: o.id } }));
      s = handleEvent(s);
    }
    s = ok(applyOperation(s, { op: "consolidate" }));
    s = handleEvent(s);
    expect(expensiveDebts(s).length).toBe(0);
    expect(s.month.eventDone).toBe(true);
    s = ok(applyOperation(s, { op: "budget", lifestyle: "saver" }));
    const p = projection(s);
    expect(p.firm).toBeGreaterThanOrEqual(0);
    expect(p.me).toBeGreaterThanOrEqual(0);
    expect(evaluateGoals(s).every((g) => g.ok)).toBe(true);
    s = closeMonth(s);
    expect(s.result!.pass).toBe(true);
    expect(s.result!.xp).toBeGreaterThan(0);
    s = nextLevel(s);
    expect(s.level).toBe(2);
    expect(availableOperations(s).map((o) => o.id)).toContain("savings");
  });
});

describe("zdarzenia", () => {
  it("awaria auta bez AC – trzeba zapłacić całość; chwilówka psuje cel", () => {
    let s = beginMonth(createGame(worstCase, 5));
    s = triggerEvent(s, "carBreakdown");
    expect(s.phase).toBe("event");
    expect(s.month.event!.toPay).toBe(1800);
    s = ok(resolveEvent(s, { kind: "cost", source: "loan" }));
    expect(s.month.flags.newDebt).toBe(true);
    expect(s.debts.some((d) => d.key === "emergency")).toBe(true);
  });

  it("z AC płacisz tylko udział własny", () => {
    let s = beginMonth(createGame({ ...worstCase, insurances: ["ac"] }, 5));
    s = triggerEvent(s, "carBreakdown");
    expect(s.month.event!.toPay).toBe(300);
  });

  it("spadek na spłatę długów zmniejsza drogie długi", () => {
    let s = beginMonth(createGame(worstCase, 5));
    s = triggerEvent(s, "inherit");
    s = ok(resolveEvent(s, { kind: "inherit", choice: "debt" }));
    expect(expensiveDebts(s).length).toBe(0);
  });

  it("silnik nie mutuje stanu wejściowego", () => {
    const s = beginMonth(createGame(worstCase, 9));
    const before = JSON.stringify(s);
    applyOperation(s, { op: "sell" });
    closeMonth(s);
    expect(JSON.stringify(s)).toBe(before);
  });
});
