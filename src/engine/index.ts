// Publiczne API silnika gry Finance Quest (czysty TypeScript, bez UI).
export * from "./types";
export * from "./content";
export * from "./economy";
export * from "./format";
export { evaluateGoals, levelGoalIds, missingInsurance } from "./goals";
export {
  createGame,
  emptyProfile,
  beginMonth,
  closeMonth,
  retryLevel,
  nextLevel,
  resolveEvent,
  triggerEvent,
  pickEvent,
  eventText,
  currentLevel,
  totalLevels,
} from "./game";
export { applyOperation, availableOperations, isUnlocked } from "./operations";
