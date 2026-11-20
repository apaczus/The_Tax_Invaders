import { describe, expect, it } from "vitest";
import {
  EVENTS,
  INDUSTRIES,
  INSURANCES,
  LEVELS,
  beginMonth,
  createGame,
  emptyProfile,
  eventText,
  resolveEvent,
  triggerEvent,
  type Profile,
} from "./index";

const base: Profile = {
  ...emptyProfile(),
  name: "Ola",
  firmName: "Studio",
  industry: "gastro",
  firmAge: "m1_3",
  housing: "rent",
  car: "none",
  insurances: ["none"],
  debts: ["karta"],
  cushion: "lt1",
  separated: "yes",
};

describe("spójność scenariuszy", () => {
  it("każde zdarzenie z levels.json istnieje w events.json", () => {
    for (const lv of LEVELS) {
      for (const id of lv.events) expect(EVENTS[id], `level ${lv.n}: brak zdarzenia ${id}`).toBeDefined();
    }
  });

  it("ubezpieczenia w zdarzeniach istnieją w insurances.json", () => {
    for (const [id, e] of Object.entries(EVENTS)) {
      if (e.insurance) expect(INSURANCES[e.insurance], `${id}: nieznane ubezpieczenie ${e.insurance}`).toBeDefined();
    }
  });

  it("w każdej branży teksty zdarzeń nie mają niepodmienionych {zmiennych}", () => {
    for (const industry of Object.keys(INDUSTRIES)) {
      const s = createGame({ ...base, industry }, 1);
      for (const id of Object.keys(EVENTS)) {
        expect(eventText(s, id), `${industry}/${id}`).not.toMatch(/\{\w+\}/);
      }
    }
  });

  it("każdy level ma co najmniej 2 możliwe zdarzenia – z autem i bez", () => {
    for (const car of ["private", "none"] as const) {
      for (const lv of LEVELS) {
        const pool = lv.events.filter((id) => {
          const r = EVENTS[id].requires;
          if (r === "car") return car === "private";
          if (r === "noCar") return car !== "private";
          return r !== "etf";
        });
        expect(pool.length, `level ${lv.n}, auto=${car}`).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe("nowe zdarzenia", () => {
  it("konkurencja zmniejsza gotówkę firmy, viral ją zwiększa", () => {
    const s = beginMonth(createGame(base, 3));
    const down = triggerEvent(s, "competitor");
    expect(down.firm.cash).toBe(s.firm.cash - 3000);
    const up = triggerEvent(s, "viral");
    expect(up.firm.cash).toBe(s.firm.cash + 4000);
  });

  it("włamanie z ubezpieczeniem mienia = tylko udział własny", () => {
    const s = beginMonth(createGame({ ...base, insurances: ["firm_prop"] }, 3));
    expect(triggerEvent(s, "burglary").month.event!.toPay).toBe(500);
  });

  it("premia do poduszki zwiększa oszczędności o 8 000 zł", () => {
    const s = triggerEvent(beginMonth(createGame(base, 3)), "bonus");
    const r = resolveEvent(s, { kind: "inherit", choice: "savings" });
    expect(r.error).toBeUndefined();
    expect(r.state.me.savings).toBe(s.me.savings + 8000);
  });
});
