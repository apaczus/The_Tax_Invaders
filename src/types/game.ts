/**
 * FlowCity – WSPÓLNY KONTRAKT DANYCH dla całej gry.
 *
 * Z tego pliku korzystają: silnik (src/engine), dane (src/data), store (src/store)
 * i UI (src/components). NIE ZMIENIAJ go bez uzgodnienia z całym zespołem
 * (osobny, mały PR, wszyscy wiedzą). Patrz CLAUDE.md.
 *
 * Konwencje:
 * - Kwoty są liczbami w jednej walucie (zł), bez groszy w logice gry.
 * - Procenty / stopy zapisujemy jako ułamki: 0.05 = 5%.
 * - Czas gry liczymy w miesiącach (1–12); jedna tura może obejmować kilka miesięcy.
 */

/* ------------------------------------------------------------------ */
/* Identyfikatory                                                      */
/* ------------------------------------------------------------------ */

/** Profil pokoleniowy – odpowiedź na „Innovations for all generations”. */
export type GenerationId = 'young_founder' | 'mature_business' | 'pre_retirement'

/** Branża firmy – decyduje o puli zdarzeń. */
export type IndustryId = 'gastronomy' | 'ecommerce' | 'it_services'

/** Budynek = jedna dziedzina finansów. */
export type BuildingId = 'liquidity' | 'investing' | 'taxes' | 'growth'

/** Poziom budynku. 0 = zablokowany, 1–3 = odblokowany / ulepszony. */
export type BuildingLevel = 0 | 1 | 2 | 3

/** Klasy aktywów, w które gracz może ulokować wolną gotówkę. */
export type AssetClass = 'deposit' | 'bonds' | 'etf'

export type RiskTolerance = 'low' | 'medium' | 'high'

export type EventAnswer = 'yes' | 'no'

/** Strategie porównywane na ekranie podsumowania. */
export type StrategyId = 'player' | 'cautious' | 'aggressive'

/* ------------------------------------------------------------------ */
/* Presety (src/data/presets.json)                                     */
/* ------------------------------------------------------------------ */

/** Podstawowy budżet firmy – podawany w onboardingu albo brany z presetu. */
export interface Budget {
  startingCash: number
  monthlyRevenue: number
  monthlyFixedCosts: number
}

export interface GenerationPreset {
  id: GenerationId
  name: string
  description: string
  /** Horyzont inwestycyjny w latach – wpływa na komentarze i ocenę ryzyka. */
  horizonYears: number
  riskTolerance: RiskTolerance
  /** Mnożnik kary za straty (np. przed emeryturą strata boli bardziej). */
  lossAversion: number
}

export interface IndustryPreset {
  id: IndustryId
  name: string
  description: string
  /** Gotowy budżet startowy dla tej branży. */
  defaultBudget: Budget
  /** Zmienność przychodów miesiąc do miesiąca (0.1 = ±10%). */
  revenueVolatility: number
}

export interface Presets {
  generations: GenerationPreset[]
  industries: IndustryPreset[]
}

/* ------------------------------------------------------------------ */
/* Budynki (src/data/buildings.json)                                   */
/* ------------------------------------------------------------------ */

/**
 * Bonus w symulacji za poziom budynku. Wszystkie pola opcjonalne;
 * bonusy z różnych budynków się sumują.
 */
export interface BuildingBonus {
  /** Obniżka efektywnej stawki podatku, np. 0.02 = -2 p.p. */
  taxRateReduction?: number
  /** Dodatkowy roczny zwrot z portfela, np. 0.01 = +1 p.p. */
  investmentReturnBonus?: number
  /** Ułamek, o który zmniejszamy negatywne skutki zdarzeń, np. 0.15 = -15%. */
  riskReduction?: number
  /** Wzrost miesięcznych przychodów, np. 0.03 = +3%. */
  revenueGrowth?: number
}

export interface BuildingDefinition {
  id: BuildingId
  name: string
  description: string
  /** Bonusy dla poziomów 1, 2, 3 (indeks 0 = poziom 1). */
  bonusPerLevel: [BuildingBonus, BuildingBonus, BuildingBonus]
}

/* ------------------------------------------------------------------ */
/* Lekcje (src/data/lessons.json)                                      */
/* ------------------------------------------------------------------ */

export interface QuizQuestion {
  prompt: string
  options: string[]
  correctIndex: number
  /** Krótkie wyjaśnienie pokazywane po odpowiedzi. */
  explanation: string
}

export interface Lesson {
  id: string
  buildingId: BuildingId
  /** Poziom budynku, który ta lekcja odblokowuje (1–3). */
  unlocksLevel: Exclude<BuildingLevel, 0>
  title: string
  /** 2–3 zdania treści. */
  content: string
  question: QuizQuestion
  /** Pojęcie, które trafia na listę „czego się nauczyłeś”. */
  concept: string
}

/* ------------------------------------------------------------------ */
/* Zdarzenia TAK/NIE (src/data/events.json)                            */
/* ------------------------------------------------------------------ */

/** Zmiana stanu gry wywołana odpowiedzią na zdarzenie. Pola to DELTY. */
export interface EventEffect {
  cash?: number
  reserve?: number
  monthlyRevenue?: number
  monthlyFixedCosts?: number
  /** Procentowa zmiana wartości całego portfela, np. -0.15 = rynek -15%. */
  portfolioChangePct?: number
}

export interface EventOutcome {
  /** Tekst przycisku / kierunku przesunięcia, np. „Biorę zlecenie”. */
  label: string
  effect: EventEffect
  /** Krótkie „dlaczego” po decyzji (max 2 zdania). */
  explanation: string
}

export interface TinderEvent {
  id: string
  /** Branża, której dotyczy zdarzenie; 'all' = może się trafić każdemu. */
  industry: IndustryId | 'all'
  title: string
  description: string
  yes: EventOutcome
  no: EventOutcome
  /** Budynek, którego bonus łagodzi lub wzmacnia skutki tego zdarzenia. */
  relatedBuilding?: BuildingId
  /** Pojęcie, którego uczy to zdarzenie. */
  concept?: string
}

/** Kształt pliku events.json. */
export interface EventsData {
  events: TinderEvent[]
}

/** Kształt pliku lessons.json. */
export interface LessonsData {
  lessons: Lesson[]
}

/** Kształt pliku buildings.json. */
export interface BuildingsData {
  buildings: BuildingDefinition[]
}

/* ------------------------------------------------------------------ */
/* Stan gry                                                            */
/* ------------------------------------------------------------------ */

/** Dane z onboardingu. */
export interface UserProfile {
  generation: GenerationId
  industry: IndustryId
  budget: Budget
}

export interface Finances {
  /** Gotówka operacyjna na koncie firmy. */
  cash: number
  /** Poduszka finansowa – odłożona, nie pracuje, ale chroni przed kryzysem. */
  reserve: number
  monthlyRevenue: number
  monthlyFixedCosts: number
}

/** Wartość ulokowana w poszczególnych klasach aktywów. */
export type Portfolio = Record<AssetClass, number>

export interface Building {
  id: BuildingId
  level: BuildingLevel
}

/**
 * Jak gracz dzieli WOLNĄ gotówkę w danej turze.
 * Ułamki od 0 do 1; suma <= 1, reszta zostaje jako gotówka.
 */
export interface Allocation {
  reserve: number
  deposit: number
  bonds: number
  etf: number
}

/** Decyzja gracza w jednej turze. */
export interface TurnDecision {
  allocation: Allocation
  eventId: string
  answer: EventAnswer
}

/** Zrzut najważniejszych liczb – do wykresów i porównań. */
export interface Snapshot {
  month: number
  cash: number
  reserve: number
  portfolioValue: number
  /** cash + reserve + portfolioValue */
  netWorth: number
}

/** Wynik jednej tury – trafia do historii i na ekran skutku. */
export interface TurnResult {
  turn: number
  /** Miesiąc po zakończeniu tury. */
  month: number
  eventId: string
  answer: EventAnswer
  before: Snapshot
  after: Snapshot
  /** Zysk/strata portfela w tej turze. */
  portfolioReturn: number
  /** Podatek zapłacony w tej turze. */
  taxPaid: number
  /** Krótkie komentarze „dlaczego” do pokazania graczowi. */
  explanations: string[]
}

export type GameStatus = 'onboarding' | 'playing' | 'finished'

export interface GameState {
  status: GameStatus
  /** Seed generatora losowego – ten sam seed = to samo demo. */
  seed: number
  /** Aktualny stan generatora losowego (silnik go aktualizuje). */
  rngState: number
  profile: UserProfile | null
  /** Aktualny miesiąc gry (0 = start, 12 = koniec roku). */
  month: number
  /** Numer bieżącej tury (od 1). */
  turn: number
  maxTurns: number
  finances: Finances
  portfolio: Portfolio
  buildings: Record<BuildingId, BuildingLevel>
  completedLessonIds: string[]
  /** Pojęcia zebrane z lekcji i zdarzeń – do ekranu podsumowania. */
  learnedConcepts: string[]
  /** Id zdarzenia czekającego na decyzję w bieżącej turze. */
  currentEventId: string | null
  /** Id zdarzeń, które już padły (żeby się nie powtarzały). */
  usedEventIds: string[]
  history: TurnResult[]
}

/** Ścieżka do wykresu porównania na podsumowaniu. */
export interface StrategyPath {
  strategy: StrategyId
  label: string
  snapshots: Snapshot[]
}

/* ------------------------------------------------------------------ */
/* Sygnatury silnika (implementacja w src/engine)                      */
/* ------------------------------------------------------------------ */

/** Tworzy stan startowy po onboardingu. */
export type CreateInitialStateFn = (profile: UserProfile, seed: number) => GameState

/** Losuje (deterministycznie) zdarzenie na bieżącą turę. */
export type DrawEventFn = (state: GameState, events: TinderEvent[]) => {
  state: GameState
  event: TinderEvent
}

/** Główny krok symulacji: stan + decyzja + zdarzenie -> nowy stan + wynik tury. */
export type StepFn = (
  state: GameState,
  decision: TurnDecision,
  event: TinderEvent,
  buildings: BuildingDefinition[],
) => { state: GameState; result: TurnResult }

/** Zalicza lekcję. Przy poprawnej odpowiedzi podnosi poziom budynku. */
export type CompleteLessonFn = (
  state: GameState,
  lesson: Lesson,
  answerIndex: number,
) => { state: GameState; correct: boolean }

/** Liczy ścieżki porównawcze (gracz vs ostrożna vs agresywna) do podsumowania. */
export type SimulateAlternativesFn = (state: GameState) => StrategyPath[]
