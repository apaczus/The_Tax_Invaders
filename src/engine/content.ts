// Typowany dostęp do danych gry z plików JSON (src/data).
// Kwoty i teksty edytujemy w JSON-ach, nie w kodzie.
import economyJson from "../data/economy.json";
import industriesJson from "../data/industries.json";
import debtsJson from "../data/debts.json";
import insurancesJson from "../data/insurances.json";
import operationsJson from "../data/operations.json";
import levelsJson from "../data/levels.json";
import goalsJson from "../data/goals.json";
import eventsJson from "../data/events.json";
import onboardingJson from "../data/onboarding.json";
import type { DebtKind, Owner, OperationId } from "./types";

export interface Industry {
  label: string;
  icon: string;
  type: string;
  variableCosts: string;
  rent: string;
  role: string;
  equip: string;
  equipFail: string;
  claim: string;
  order: string;
  marketing: string;
  stageIcons: string[];
}

export interface DebtDef {
  name: string;
  owner: Owner;
  balance: number;
  rate: number;
  minPayment: number | "card";
  kind: DebtKind;
  label: string;
  hint: string;
  icon: string;
}

export interface InsuranceDef {
  name: string;
  owner: Owner;
  cost: number;
  desc: string;
  icon: string;
}

export interface OperationDef {
  id: OperationId;
  unlockLevel: number;
  icon: string;
  name: string;
  sub: string;
}

export interface Lesson {
  title: string;
  art: string;
  points: string[];
  takeaway: string;
}

export interface LevelDef {
  n: number;
  icon: string;
  title: string;
  brief: string;
  goals: string[];
  events: string[];
  eventTiming: "midMonth" | "atClose";
  lesson: Lesson;
}

export interface GoalDef {
  label: string;
  why: string;
  fix: string;
  amount?: number;
  onlyIfNotSeparatedAtStart?: boolean;
}

export interface EventDef {
  kind: "cost" | "info" | "inherit" | "market";
  icon: string;
  title: string;
  text: string;
  tone?: "good" | "bad" | "warn";
  owner?: Owner;
  cost?: number;
  insurance?: string;
  deductible?: number;
  firmLoss?: number;
  requires?: "car" | "noCar" | "etf";
  effect?: { firmCash?: number; meCash?: number; firmReceivable?: number };
  lesson?: string;
  amount?: number;
  drop?: number;
  buyAmount?: number;
}

export interface OnboardingOption {
  value: string;
  label: string;
  hint?: string;
  icon?: string;
  showIf?: Record<string, string>;
}

export interface OnboardingQuestion {
  field: string;
  type: "text" | "single" | "multi";
  label?: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  source?: "industries" | "debts";
  options?: OnboardingOption[];
  extraOptions?: OnboardingOption[];
  noneValue?: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  sub: string;
  questions: OnboardingQuestion[];
}

const stripComment = <T extends object>(o: T): T => {
  const { _comment, ...rest } = o as T & { _comment?: string };
  return rest as T;
};

export const ECON = economyJson;
export const INDUSTRIES = industriesJson as Record<string, Industry>;
export const DEBTS = stripComment(debtsJson) as unknown as Record<string, DebtDef>;
export const INSURANCES = insurancesJson as Record<string, InsuranceDef>;
export const OPERATIONS = operationsJson as OperationDef[];
export const LEVELS = levelsJson as LevelDef[];
export const GOALS = stripComment(goalsJson) as unknown as Record<string, GoalDef>;
export const EVENTS = stripComment(eventsJson) as unknown as Record<string, EventDef>;
export const ONBOARDING = onboardingJson as OnboardingStep[];

export const LIFESTYLE_LABEL: Record<string, string> = { saver: "Oszczędny", normal: "Normalny", comfy: "Wygodny" };

export function industryOf(key: string): Industry {
  return INDUSTRIES[key] ?? INDUSTRIES.gastro;
}

/** Podstawia {klucz} tekstami z branży / zmiennymi. */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}
