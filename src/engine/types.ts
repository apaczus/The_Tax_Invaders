// Typy domenowe silnika gry. Silnik nie zależy od React / React Native.

export type Owner = "me" | "firm";
export type DebtKind = "expensive" | "normal" | "zero" | "mortgage";
export type Lifestyle = "saver" | "normal" | "comfy";
export type Housing = "rent" | "mortgage" | "own" | "family";
export type CarOwnership = "none" | "private" | "firm";
export type CushionAnswer = "none" | "lt1" | "m1_3" | "m3";

/** Odpowiedzi z onboardingu. */
export interface Profile {
  name: string;
  firmName: string;
  industry: string;
  firmAge: string;
  firmDesc: string;
  housing: Housing | "";
  car: CarOwnership | "";
  insurances: string[];
  debts: string[];
  cushion: CushionAnswer | "";
  separated: "yes" | "no" | "";
}

export interface Debt {
  id: string;
  key: string;
  name: string;
  owner: Owner;
  balance: number;
  /** oprocentowanie miesięczne */
  rate: number;
  minPayment: number | "card";
  kind: DebtKind;
}

export interface Overdue {
  id: string;
  name: string;
  owner: Owner;
  amount: number;
}

export interface Firm {
  cash: number;
  reserve: number;
  revenueNow: number;
  staff: number;
  equip: null | "cash" | "lease";
  leaseLeft: number;
  marketingNext: number;
  receivable: number;
}

export interface Personal {
  cash: number;
  savings: number;
  lifestyle: Lifestyle;
  salary: number;
  salaryNext: number;
  soldStuff: boolean;
}

export interface LogEntry {
  level: number;
  text: string;
  amount: number;
  account: Owner;
}

export interface MonthFlags {
  newDebt?: boolean;
  liquidityBroken?: boolean;
  firmNegative?: boolean;
  panicSold?: boolean;
  marketDropped?: boolean;
  firstExpensivePaid?: boolean;
  badges: string[];
}

export interface PendingEvent {
  id: string;
  /** wyliczone przy odpaleniu */
  covered: number;
  toPay: number;
  /** czy zdarzenie odpalono przy próbie zamknięcia miesiąca */
  atClose: boolean;
  resolved: boolean;
  outcome?: string;
}

export interface MonthState {
  actions: number;
  attempt: number;
  eventDone: boolean;
  event: PendingEvent | null;
  flags: MonthFlags;
}

export interface GoalResult {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
  why: string;
  fix: string;
}

export interface MonthResult {
  pass: boolean;
  goals: GoalResult[];
  firmIn: number;
  firmOut: number;
  meIn: number;
  meOut: number;
  xp: number;
}

export type Phase = "brief" | "play" | "event" | "result" | "end";

export interface GameState {
  version: 1;
  rng: number;
  nextId: number;
  profile: Profile;
  separatedAtStart: boolean;
  separated: boolean;
  level: number;
  xp: number;
  badges: string[];
  phase: Phase;
  firm: Firm;
  me: Personal;
  debts: Debt[];
  overdue: Overdue[];
  insurance: Record<string, boolean>;
  investments: { bonds: number; etf: number };
  month: MonthState;
  log: LogEntry[];
  history: { label: string; netWorth: number }[];
  /** stan z początku miesiąca – do powtórki levelu */
  snapshot: Omit<GameState, "snapshot"> | null;
  result: MonthResult | null;
  /** ostatnie porażki – pokazywane w briefie przy powtórce */
  lastFails: GoalResult[] | null;
}

// ---------- operacje (akcje gracza) ----------
export type OperationInput =
  | { op: "pay"; target: { type: "debt" | "overdue"; id: string }; amount?: number }
  | { op: "transfer"; direction: "firmToMe" | "meToFirm"; amount: number }
  | { op: "budget"; lifestyle: Lifestyle }
  | { op: "sell" }
  | { op: "consolidate" }
  | { op: "separate" }
  | { op: "savings"; direction: "in" | "out"; amount: number }
  | { op: "reserve"; direction: "in" | "out"; amount: number }
  | { op: "salary"; amount: number }
  | { op: "hire" }
  | { op: "equip"; payment: "cash" | "lease" }
  | { op: "marketing" }
  | { op: "insurance"; selected: string[] }
  | { op: "invest"; product: "bonds" | "etf"; direction: "buy" | "sell"; amount: number };

export type OperationId = OperationInput["op"];

export type EventChoice =
  | { kind: "cost"; source: "me" | "savings" | "firm" | "reserve" | "loan" | "defer" }
  | { kind: "inherit"; choice: "debt" | "savings" | "firm" | "spend" }
  | { kind: "market"; choice: "hold" | "sell" | "buy" }
  | { kind: "info" };

export interface EngineResult {
  state: GameState;
  error?: string;
  messages: string[];
}
