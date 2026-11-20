// Stan aplikacji: szkic onboardingu + stan gry. Zapis w AsyncStorage (na webie: localStorage).
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  applyOperation,
  beginMonth,
  closeMonth,
  createGame,
  emptyProfile,
  nextLevel,
  resolveEvent,
  retryLevel,
  type EventChoice,
  type GameState,
  type OperationInput,
  type Profile,
} from "../engine";

interface Toast {
  id: number;
  text: string;
}

interface GameStore {
  hydrated: boolean;
  draft: Profile;
  onboardingStep: number;
  game: GameState | null;
  toasts: Toast[];

  setDraft: (patch: Partial<Profile>) => void;
  setOnboardingStep: (n: number) => void;
  startGame: () => void;
  resetAll: () => void;

  begin: () => void;
  operate: (input: OperationInput) => string | undefined;
  resolve: (choice: EventChoice) => string | undefined;
  close: () => void;
  retry: () => void;
  next: () => void;

  toast: (text: string) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;

export const useGame = create<GameStore>()(
  persist(
    (set, get) => {
      const pushMessages = (messages: string[]) => messages.forEach((m) => get().toast(m));
      return {
        hydrated: false,
        draft: emptyProfile(),
        onboardingStep: 0,
        game: null,
        toasts: [],

        setDraft: (patch) => set({ draft: { ...get().draft, ...patch } }),
        setOnboardingStep: (n) => set({ onboardingStep: n }),
        startGame: () => set({ game: createGame(get().draft) }),
        resetAll: () => set({ draft: emptyProfile(), onboardingStep: 0, game: null, toasts: [] }),

        begin: () => {
          const g = get().game;
          if (g) set({ game: beginMonth(g) });
        },
        operate: (input) => {
          const g = get().game;
          if (!g) return "Brak gry";
          const r = applyOperation(g, input);
          if (r.error) return r.error;
          set({ game: r.state });
          pushMessages(r.messages);
          return undefined;
        },
        resolve: (choice) => {
          const g = get().game;
          if (!g) return "Brak gry";
          const r = resolveEvent(g, choice);
          if (r.error) return r.error;
          set({ game: r.state });
          pushMessages(r.messages);
          return undefined;
        },
        close: () => {
          const g = get().game;
          if (g) set({ game: closeMonth(g) });
        },
        retry: () => {
          const g = get().game;
          if (g) set({ game: retryLevel(g) });
        },
        next: () => {
          const g = get().game;
          if (g) set({ game: nextLevel(g) });
        },

        toast: (text) => {
          const id = ++toastId;
          set({ toasts: [...get().toasts, { id, text }] });
          setTimeout(() => get().dismissToast(id), 4000);
        },
        dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
      };
    },
    {
      name: "finance-quest-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ draft: s.draft, onboardingStep: s.onboardingStep, game: s.game }),
      onRehydrateStorage: () => () => {
        useGame.setState({ hydrated: true });
      },
    },
  ),
);
