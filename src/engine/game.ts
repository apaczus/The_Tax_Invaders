// Pętla gry: start gry, start miesiąca, zdarzenia losowe, zamknięcie miesiąca, powtórka, kolejny level.
// Każda publiczna funkcja przyjmuje stan i zwraca NOWY stan (nie mutuje wejścia).
import { DEBTS, ECON, EVENTS, INSURANCES, LEVELS, fill, industryOf } from "./content";
import { bills, debtPayment, netWorth, nextRevenue } from "./economy";
import { fmt } from "./format";
import { evaluateGoals } from "./goals";
import { nextRandom } from "./rng";
import type { EngineResult, EventChoice, GameState, Owner, Profile } from "./types";

export const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));

export function uid(s: GameState, prefix = "x"): string {
  s.nextId += 1;
  return `${prefix}${s.nextId}`;
}

export function random(s: GameState): number {
  const [v, next] = nextRandom(s.rng);
  s.rng = next;
  return v;
}

export function log(s: GameState, text: string, amount: number, account: Owner) {
  s.log.unshift({ level: s.level, text, amount, account });
}

export function badge(s: GameState, title: string) {
  if (!s.month.flags.badges.includes(title)) s.month.flags.badges.push(title);
}

export const currentLevel = (s: GameState) => LEVELS[s.level - 1];
export const totalLevels = () => LEVELS.length;

export function emptyProfile(): Profile {
  return {
    name: "",
    firmName: "",
    industry: "",
    firmAge: "",
    firmDesc: "",
    housing: "",
    car: "",
    insurances: [],
    debts: [],
    cushion: "",
    separated: "",
  };
}

/** Buduje stan startowy na podstawie onboardingu i odpala miesiąc 1. */
export function createGame(profile: Profile, seed = Date.now()): GameState {
  const p = clone(profile);
  const s: GameState = {
    version: 1,
    rng: seed | 0,
    nextId: 0,
    profile: p,
    separatedAtStart: p.separated === "yes",
    separated: p.separated === "yes",
    level: 1,
    xp: 0,
    badges: [],
    phase: "brief",
    firm: {
      cash: ECON.firm.startCash,
      reserve: 0,
      revenueNow: 0,
      staff: ECON.firm.startStaff,
      equip: null,
      leaseLeft: 0,
      marketingNext: 0,
      receivable: 0,
    },
    me: {
      cash: ECON.personal.startCash,
      savings: (ECON.personal.cushionStart as Record<string, number>)[p.cushion] ?? 0,
      lifestyle: "normal",
      salary: ECON.personal.salary,
      salaryNext: ECON.personal.salary,
      soldStuff: false,
    },
    debts: [],
    overdue: [],
    insurance: {},
    investments: { bonds: 0, etf: 0 },
    month: { actions: 0, attempt: 1, eventDone: false, event: null, flags: { badges: [] } },
    log: [],
    history: [],
    snapshot: null,
    result: null,
    lastFails: null,
  };

  for (const k of p.debts) {
    const d = DEBTS[k];
    if (d) s.debts.push({ id: uid(s, "d"), key: k, name: d.name, owner: d.owner, balance: d.balance, rate: d.rate, minPayment: d.minPayment, kind: d.kind });
  }
  if (p.housing === "mortgage") {
    s.debts.push({ id: uid(s, "d"), key: "hipo", name: "Kredyt hipoteczny", owner: "me", balance: ECON.mortgage.balance, rate: ECON.mortgage.monthlyRate, minPayment: ECON.mortgage.payment, kind: "mortgage" });
  }
  for (const o of ECON.startOverdue) s.overdue.push({ id: uid(s, "o"), name: o.name, owner: o.owner as Owner, amount: o.amount });
  if (p.debts.includes("rachunki")) {
    const o = ECON.unpaidBillsOverdue;
    s.overdue.push({ id: uid(s, "o"), name: o.name, owner: o.owner as Owner, amount: o.amount });
  }
  for (const k of Object.keys(INSURANCES)) s.insurance[k] = p.insurances.includes(k);
  s.insurance.oc_auto = p.car === "private";
  if (p.car !== "private") s.insurance.ac = false;

  s.history.push({ label: "Start", netWorth: netWorth(s) });
  startMonthMut(s);
  return s;
}

function startMonthMut(s: GameState) {
  const f = s.firm;
  const rev = nextRevenue(s);
  f.revenueNow = rev;
  f.marketingNext = 0;
  const rec = f.receivable;
  f.cash += rev + rec;
  f.receivable = 0;
  s.me.salary = s.me.salaryNext;
  f.cash -= s.me.salary;
  s.me.cash += s.me.salary;
  s.month = { actions: 0, attempt: 1, eventDone: false, event: null, flags: { badges: [] } };
  s.log = s.log.filter((l) => l.level < s.level);
  log(s, "Klienci zapłacili za usługi", rev, "firm");
  if (rec) log(s, "Spóźniony klient w końcu zapłacił", rec, "firm");
  log(s, "Twoja pensja z firmy", s.me.salary, "me");
  s.result = null;
  s.phase = "brief";
  const { snapshot: _ignored, ...rest } = s;
  s.snapshot = clone(rest);
}

/** Gracz przeczytał brief i zaczyna grać. */
export function beginMonth(state: GameState): GameState {
  const s = clone(state);
  s.phase = "play";
  return s;
}

// =====================================================================
//  ZDARZENIA LOSOWE
// =====================================================================
export function pickEvent(s: GameState): string | null {
  const lv = currentLevel(s);
  const car = s.profile.car === "private";
  const pool = lv.events.filter((id) => {
    const e = EVENTS[id];
    if (!e) return false;
    if (e.requires === "car") return car;
    if (e.requires === "noCar") return !car;
    if (e.requires === "etf") return s.investments.etf > 100;
    return true;
  });
  if (!pool.length) return null;
  return pool[Math.floor(random(s) * pool.length)];
}

export function eventText(s: GameState, id: string): string {
  const I = industryOf(s.profile.industry);
  return fill(EVENTS[id].text, {
    equipFail: I.equipFail,
    claim: I.claim,
    order: I.order,
    competitor: I.competitor,
    viral: I.viral,
    variableCosts: I.variableCosts,
  });
}

/** Odpala zdarzenie (mutuje). Zwraca true, jeśli coś się wydarzyło. */
function fireEventMut(s: GameState, atClose: boolean, forcedId?: string): boolean {
  s.month.eventDone = true;
  const id = forcedId ?? pickEvent(s);
  if (!id) return false;
  const e = EVENTS[id];
  const ev = { id, atClose, covered: 0, toPay: 0, resolved: false } as GameState["month"]["event"] & {};
  if (e.kind === "cost") {
    const cost = e.cost ?? 0;
    const insured = !!(e.insurance && s.insurance[e.insurance]);
    ev.covered = insured ? cost - (e.deductible ?? 0) : 0;
    ev.toPay = cost - ev.covered;
    if (e.firmLoss) {
      s.firm.cash -= e.firmLoss;
      log(s, "Utracony przychód (zwolnienie lekarskie)", -e.firmLoss, "firm");
    }
    if (insured) badge(s, "Ubezpieczenie zadziałało");
  }
  if (e.kind === "info" && e.effect) {
    const fx = e.effect;
    if (fx.firmCash) {
      s.firm.cash += fx.firmCash;
      log(s, e.title, fx.firmCash, "firm");
    }
    if (fx.meCash) {
      s.me.cash += fx.meCash;
      log(s, e.title, fx.meCash, "me");
    }
    if (fx.firmReceivable) {
      s.firm.cash -= fx.firmReceivable;
      s.firm.receivable += fx.firmReceivable;
      log(s, "Klient przesunął płatność na przyszły miesiąc", -fx.firmReceivable, "firm");
    }
  }
  if (e.kind === "market") {
    s.investments.etf *= 1 - (e.drop ?? 0.15);
    s.month.flags.marketDropped = true;
  }
  s.month.event = ev;
  s.phase = "event";
  return true;
}

/** Po operacji gracza – czy pora na zdarzenie w trakcie miesiąca. */
export function maybeTriggerEvent(state: GameState): GameState {
  const lv = currentLevel(state);
  if (state.month.eventDone || lv.eventTiming !== "midMonth") return state;
  if (state.month.actions < ECON.eventAfterActions) return state;
  const s = clone(state);
  fireEventMut(s, false);
  return s;
}

/** Do testów / dema: wymusza konkretne zdarzenie. */
export function triggerEvent(state: GameState, id: string): GameState {
  const s = clone(state);
  fireEventMut(s, false, id);
  return s;
}

export function resolveEvent(state: GameState, choice: EventChoice): EngineResult {
  const s = clone(state);
  const ev = s.month.event;
  if (!ev || ev.resolved) return { state, error: "Brak zdarzenia do obsłużenia.", messages: [] };
  const e = EVENTS[ev.id];
  const messages: string[] = [];
  const fail = (error: string): EngineResult => ({ state, error, messages: [] });

  if (e.kind === "cost" && choice.kind === "cost") {
    const amt = ev.toPay;
    const own = e.owner ?? "me";
    const src = choice.source;
    if (amt > 0) {
      if (src === "me") {
        if (s.me.cash < amt) return fail("Za mało na koncie osobistym.");
        s.me.cash -= amt;
      } else if (src === "savings") {
        if (s.me.savings < amt) return fail("Za mało w poduszce.");
        s.me.savings -= amt;
      } else if (src === "firm") {
        if (s.firm.cash < amt) return fail("Za mało na koncie firmy.");
        s.firm.cash -= amt;
      } else if (src === "reserve") {
        if (s.firm.reserve < amt) return fail("Za mało w rezerwie firmy.");
        s.firm.reserve -= amt;
      } else if (src === "loan") {
        s.debts.push({
          id: uid(s, "d"),
          key: "emergency",
          name: own === "firm" ? "Pożyczka pozabankowa (firma)" : `Chwilówka: ${e.title.toLowerCase()}`,
          owner: own,
          balance: amt,
          rate: ECON.emergencyLoanMonthlyRate,
          minPayment: Math.round(amt * 0.2),
          kind: "expensive",
        });
        s.month.flags.newDebt = true;
        messages.push("Chwilówka rozwiązała problem dziś, ale zjada Twoje przyszłe pieniądze.");
      } else if (src === "defer") {
        s.overdue.push({ id: uid(s, "o"), name: e.title, owner: own, amount: amt });
        messages.push("Nieopłacone – to teraz zaległość z karą 10% miesięcznie.");
      }
      if (src !== "defer") log(s, e.title, -amt, src === "me" || src === "savings" ? "me" : src === "loan" ? own : "firm");
      if (["me", "savings", "firm", "reserve"].includes(src) && !ev.covered) badge(s, "Kryzys opanowany bez długu");
    } else {
      log(s, `${e.title} – pokryte przez ubezpieczenie`, 0, own);
    }
    ev.outcome = src;
  } else if (e.kind === "inherit" && choice.kind === "inherit") {
    const amt = e.amount ?? 10000;
    if (choice.choice === "debt") {
      let left = amt;
      const ds = s.debts.filter((d) => d.kind !== "mortgage" && d.kind !== "zero").sort((a, b) => b.rate - a.rate);
      for (const d of ds) {
        const a = Math.min(left, d.balance);
        d.balance -= a;
        left -= a;
        if (!left) break;
      }
      s.debts = s.debts.filter((d) => d.balance > 0.5);
      s.me.savings += left;
      log(s, `${e.title}: spłata najdroższych długów` + (left ? ", reszta do poduszki" : ""), amt, "me");
      messages.push("Świetnie – spłacony dług to pewny zysk." + (left ? ` Reszta (${fmt(left)}) trafiła do poduszki.` : ""));
      badge(s, "Mądrze wykorzystany spadek");
    } else if (choice.choice === "savings") {
      s.me.savings += amt;
      log(s, `${e.title} → poduszka`, amt, "me");
      messages.push("Poduszka urosła. Bezpiecznie i rozsądnie.");
      badge(s, "Mądrze wykorzystany spadek");
    } else if (choice.choice === "firm") {
      s.firm.reserve += amt;
      log(s, `${e.title} → rezerwa firmy`, amt, "firm");
      messages.push("Firma ma zapas na gorsze miesiące i na rozwój.");
      badge(s, "Mądrze wykorzystany spadek");
    } else {
      log(s, `${e.title}: wszystko wydane na wakacje i nowy telefon`, 0, "me");
      messages.push(`Było miło… ale ${fmt(amt)} zniknęło bez śladu. Spłacony dług albo poduszka pracowałyby dla Ciebie latami.`);
    }
    ev.outcome = choice.choice;
  } else if (e.kind === "market" && choice.kind === "market") {
    if (choice.choice === "sell") {
      const v = s.investments.etf;
      s.me.cash += v;
      s.investments.etf = 0;
      s.month.flags.panicSold = true;
      log(s, "Sprzedaż ETF w panice", v, "me");
      messages.push("Sprzedałeś ze stratą. Strata z papierowej stała się prawdziwa.");
    } else if (choice.choice === "buy") {
      const buy = e.buyAmount ?? 2000;
      if (s.me.cash < buy) return fail("Za mało na koncie osobistym.");
      s.me.cash -= buy;
      s.investments.etf += buy;
      log(s, "Dokupiony ETF po niższej cenie", -buy, "me");
      badge(s, "Kupujesz, gdy inni panikują");
      messages.push("Dokupiłeś taniej. W długim terminie to zwykle się opłaca.");
    } else {
      badge(s, "Trzymasz kurs");
      messages.push("Trzymasz kurs. Spadki są częścią inwestowania.");
    }
    ev.outcome = choice.choice;
  } else if (e.kind === "info") {
    ev.outcome = "ok";
  } else {
    return fail("Nieprawidłowy wybór.");
  }

  ev.resolved = true;
  s.phase = "play";
  if (ev.atClose) messages.push("Zdarzenie obsłużone. Sprawdź prognozę i zamknij miesiąc ponownie.");
  return { state: s, messages };
}

// =====================================================================
//  ZAMKNIĘCIE MIESIĄCA
// =====================================================================
export function closeMonth(state: GameState): GameState {
  if (state.phase !== "play") return state;
  const lv = currentLevel(state);
  if (!state.month.eventDone && lv.eventTiming === "atClose") {
    const s = clone(state);
    if (fireEventMut(s, true)) return s;
    return closeMonth(s);
  }
  const s = clone(state);
  const b = bills(s);
  const fl = s.month.flags;
  s.firm.cash -= b.firmTotal;
  s.me.cash -= b.meTotal;
  for (const d of s.debts) {
    const interest = d.balance * d.rate;
    const pay = debtPayment(d);
    d.balance = Math.max(0, d.balance + interest - pay);
  }
  s.debts = s.debts.filter((d) => d.balance > 0.5);
  for (const o of s.overdue) o.amount = Math.round(o.amount * (1 + ECON.overduePenaltyRate));
  s.me.savings *= 1 + ECON.savingsMonthlyRate;
  s.investments.bonds *= 1 + ECON.bondsMonthlyRate;
  if (!fl.marketDropped) s.investments.etf *= 1 + (ECON.etfMonthlyMin + random(s) * (ECON.etfMonthlyMax - ECON.etfMonthlyMin));
  if (s.firm.leaseLeft > 0) s.firm.leaseLeft--;
  if (s.me.cash < 0) {
    fl.liquidityBroken = true;
    s.debts.push({ id: uid(s, "d"), key: "overdraft", name: "Debet (zabrakło na rachunki)", owner: "me", balance: -s.me.cash, rate: 0.017, minPayment: 100, kind: "expensive" });
    s.me.cash = 0;
  }
  if (s.firm.cash < 0) {
    fl.liquidityBroken = true;
    fl.firmNegative = true;
    s.overdue.push({ id: uid(s, "o"), name: "Niezapłacone rachunki firmy", owner: "firm", amount: Math.round(-s.firm.cash) });
    s.firm.cash = 0;
  }
  const goals = evaluateGoals(s, true);
  const pass = goals.every((g) => g.ok);
  let xp = 0;
  if (pass) {
    xp = Math.max(60, 100 + goals.length * 20 + fl.badges.length * 25 - (s.month.attempt - 1) * 20);
    s.xp += xp;
    for (const t of fl.badges) if (!s.badges.includes(t)) s.badges.push(t);
    s.history.push({ label: `M${s.level}`, netWorth: netWorth(s) });
  }
  s.result = { pass, goals, firmIn: s.firm.revenueNow, firmOut: b.firmTotal, meIn: s.me.salary, meOut: b.meTotal, xp };
  s.phase = "result";
  return s;
}

/** Porażka: wracamy do stanu z początku miesiąca, z listą błędów do pokazania. */
export function retryLevel(state: GameState): GameState {
  if (!state.snapshot) return state;
  const fails = state.result?.goals.filter((g) => !g.ok) ?? null;
  const attempt = state.month.attempt + 1;
  const s = clone(state.snapshot) as GameState;
  s.snapshot = clone(state.snapshot);
  s.month.attempt = attempt;
  s.lastFails = fails;
  s.rng = state.rng; // inne losowanie zdarzenia przy powtórce
  s.phase = "brief";
  return s;
}

export function nextLevel(state: GameState): GameState {
  const s = clone(state);
  s.lastFails = null;
  if (s.level >= LEVELS.length) {
    s.phase = "end";
    return s;
  }
  s.level += 1;
  startMonthMut(s);
  return s;
}
