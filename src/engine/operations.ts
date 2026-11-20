// Operacje z panelu bocznego. Każda operacja waliduje dane i zwraca nowy stan albo błąd.
import { ECON, INSURANCES, LIFESTYLE_LABEL, OPERATIONS, industryOf } from "./content";
import { expensiveDebts } from "./economy";
import { fmt } from "./format";
import { badge, clone, log, maybeTriggerEvent, uid } from "./game";
import type { EngineResult, GameState, OperationId, OperationInput } from "./types";

/** Operacje dostępne na danym levelu (więcej z każdym miesiącem). */
export function availableOperations(s: GameState) {
  return OPERATIONS.filter((o) => o.unlockLevel <= s.level).filter((o) => !(o.id === "separate" && s.separated));
}

export function isUnlocked(s: GameState, id: OperationId) {
  return availableOperations(s).some((o) => o.id === id);
}

export function applyOperation(state: GameState, input: OperationInput): EngineResult {
  if (state.phase !== "play") return { state, error: "Najpierw dokończ to, co jest na ekranie.", messages: [] };
  if (!isUnlocked(state, input.op)) return { state, error: "Ta operacja odblokuje się na wyższym levelu.", messages: [] };
  const s = clone(state);
  const messages: string[] = [];
  const f = s.firm, me = s.me, I = industryOf(s.profile.industry);
  const err = (error: string): EngineResult => ({ state, error, messages: [] });
  const amountOk = (a: number) => Number.isFinite(a) && a > 0;

  switch (input.op) {
    case "pay": {
      const isOverdue = input.target.type === "overdue";
      const obj = isOverdue ? s.overdue.find((o) => o.id === input.target.id) : s.debts.find((d) => d.id === input.target.id);
      if (!obj) return err("Nie znaleziono tej pozycji.");
      const acc = obj.owner === "firm" ? f : me;
      const owed = "amount" in obj ? obj.amount : obj.balance;
      const a = Math.min(input.amount && input.amount > 0 ? input.amount : owed, owed);
      if (a > acc.cash + 0.5) {
        return err(
          `Za mało środków na ${obj.owner === "firm" ? "koncie firmy" : "Twoim koncie"} (${fmt(acc.cash)}).` +
            (obj.owner === "me" ? " Możesz przelać pieniądze z firmy operacją „Przelew firma ↔ Ty”." : ""),
        );
      }
      acc.cash -= a;
      if ("amount" in obj) {
        obj.amount -= a;
        if (obj.amount < 0.5) {
          s.overdue = s.overdue.filter((o) => o.id !== obj.id);
          messages.push(`Zaległość spłacona: ${obj.name} ✅`);
        }
      } else {
        if (obj.kind === "expensive" && !s.month.flags.firstExpensivePaid) {
          s.month.flags.firstExpensivePaid = true;
          if (obj.rate >= Math.max(...expensiveDebts(state).map((d) => d.rate))) badge(s, "Metoda lawiny: najpierw najdroższy dług");
        }
        obj.balance -= a;
        if (obj.kind === "zero") messages.push("💡 Ten dług jest na 0% – wcześniejsza spłata nic Ci nie daje. Gotówka lepiej służy jako poduszka.");
        else if (obj.kind === "mortgage") messages.push("💡 Nadpłata hipoteki to dobry ruch – ale dopiero, gdy masz poduszkę i zero drogich długów.");
        if (obj.balance < 0.5) {
          s.debts = s.debts.filter((d) => d.id !== obj.id);
          if (obj.kind !== "zero") messages.push(`Spłacone w całości: ${obj.name} 🎉`);
        }
      }
      log(s, `Spłata: ${obj.name}`, -a, obj.owner);
      break;
    }
    case "transfer": {
      if (!amountOk(input.amount)) return err("Podaj kwotę.");
      const toMe = input.direction === "firmToMe";
      const from = toMe ? f : me, to = toMe ? me : f;
      if (input.amount > from.cash) return err(`Za mało środków (${fmt(from.cash)}).`);
      from.cash -= input.amount;
      to.cash += input.amount;
      log(s, toMe ? "Wypłata z firmy" : "Dopłata do firmy", input.amount, toMe ? "me" : "firm");
      break;
    }
    case "budget":
      me.lifestyle = input.lifestyle;
      log(s, `Budżet domowy: ${LIFESTYLE_LABEL[me.lifestyle].toLowerCase()}`, 0, "me");
      break;
    case "sell": {
      if (me.soldStuff) return err("Już sprzedałeś wszystko, co zbędne.");
      const amt = ECON.personal.sellStuffAmount;
      me.cash += amt;
      me.soldStuff = true;
      log(s, "Sprzedaż zbędnych rzeczy", amt, "me");
      break;
    }
    case "consolidate": {
      const e = expensiveDebts(s);
      if (!e.length) return err("Nie masz drogich długów do konsolidacji.");
      const tot = e.reduce((a, d) => a + d.balance, 0);
      s.debts = s.debts.filter((d) => !e.includes(d));
      s.debts.push({
        id: uid(s, "d"),
        key: "consolidation",
        name: "Kredyt konsolidacyjny",
        owner: "me",
        balance: tot,
        rate: ECON.consolidationMonthlyRate,
        minPayment: Math.ceil((tot * ECON.consolidationPaymentShare) / 10) * 10,
        kind: "normal",
      });
      log(s, `Konsolidacja: ${e.map((d) => d.name).join(", ")}`, 0, "me");
      messages.push("Drogie długi spłacone. Zostaje jeden, tańszy kredyt.");
      break;
    }
    case "separate":
      s.separated = true;
      log(s, "Założone osobne konto firmowe", 0, "firm");
      messages.push("Konta rozdzielone ✅");
      break;
    case "savings":
    case "reserve": {
      if (!amountOk(input.amount)) return err("Podaj kwotę.");
      const isMe = input.op === "savings";
      const acc = isMe ? me : f;
      const get = () => (isMe ? me.savings : f.reserve);
      const set = (v: number) => (isMe ? (me.savings = v) : (f.reserve = v));
      if (input.direction === "in") {
        if (input.amount > acc.cash) return err(`Za mało środków (${fmt(acc.cash)}).`);
        acc.cash -= input.amount;
        set(get() + input.amount);
      } else {
        if (input.amount > get()) return err(`Masz tylko ${fmt(get())}.`);
        set(get() - input.amount);
        acc.cash += input.amount;
      }
      log(s, `${isMe ? "Poduszka" : "Rezerwa firmy"}: ${input.direction === "in" ? "wpłata" : "wypłata"}`, input.direction === "in" ? input.amount : -input.amount, isMe ? "me" : "firm");
      break;
    }
    case "salary": {
      const { salaryMin, salaryMax } = ECON.personal;
      if (!(input.amount >= salaryMin && input.amount <= salaryMax)) return err(`Pensja musi być między ${fmt(salaryMin)} a ${fmt(salaryMax)}.`);
      me.salaryNext = input.amount;
      log(s, `Pensja od przyszłego miesiąca: ${fmt(input.amount)}`, 0, "me");
      break;
    }
    case "hire":
      if (f.staff >= ECON.firm.maxStaff) return err("Lokal nie pomieści więcej osób.");
      if (f.cash < ECON.firm.hireCost) return err("Za mało na koncie firmy na rekrutację.");
      f.cash -= ECON.firm.hireCost;
      f.staff++;
      log(s, `Zatrudniono: ${I.role}`, -ECON.firm.hireCost, "firm");
      break;
    case "equip":
      if (f.equip) return err("Sprzęt już masz.");
      if (input.payment === "cash") {
        if (f.cash < ECON.firm.equipCost) return err(`Za mało na koncie firmy (${fmt(f.cash)}).`);
        f.cash -= ECON.firm.equipCost;
        f.equip = "cash";
        log(s, `Zakup: ${I.equip}`, -ECON.firm.equipCost, "firm");
      } else {
        f.equip = "lease";
        f.leaseLeft = ECON.firm.leaseMonths;
        log(s, `Leasing: ${I.equip}`, 0, "firm");
      }
      break;
    case "marketing":
      if (f.cash < ECON.firm.marketingCost) return err("Za mało na koncie firmy.");
      f.cash -= ECON.firm.marketingCost;
      f.marketingNext += ECON.firm.marketingRevenue;
      log(s, `Kampania: ${I.marketing}`, -ECON.firm.marketingCost, "firm");
      break;
    case "insurance":
      for (const k of Object.keys(INSURANCES)) if (k !== "oc_auto") s.insurance[k] = input.selected.includes(k);
      if (s.profile.car !== "private") s.insurance.ac = false;
      log(s, "Zmiana ubezpieczeń", 0, "me");
      break;
    case "invest": {
      if (!amountOk(input.amount)) return err("Podaj kwotę.");
      const p = input.product;
      if (input.direction === "buy") {
        if (input.amount > me.cash) return err(`Za mało na koncie osobistym (${fmt(me.cash)}).`);
        me.cash -= input.amount;
        s.investments[p] += input.amount;
      } else {
        if (input.amount > s.investments[p] + 0.5) return err(`Masz tylko ${fmt(s.investments[p])}.`);
        s.investments[p] -= input.amount;
        me.cash += input.amount;
      }
      log(s, `${input.direction === "buy" ? "Kupno" : "Sprzedaż"}: ${p === "bonds" ? "obligacje" : "ETF"}`, input.direction === "buy" ? -input.amount : input.amount, "me");
      break;
    }
  }
  s.month.actions++;
  return { state: maybeTriggerEvent(s), messages };
}
