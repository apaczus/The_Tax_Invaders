# FlowCity – instrukcja dla wszystkich instancji AI

Hackathon Collabothon 2026, wyzwanie **Finance Quest** (Commerzbank). 44 h na działające MVP na Vercel.
Nad projektem pracują równolegle **3 instancje AI**. Ten plik obowiązuje każdą z nich.

## Koncept

FlowCity to gra symulacyjna: miasto = firma i finanse gracza.

1. **Onboarding** – profil pokoleniowy (młody założyciel / dojrzała firma / przed emeryturą),
   branża (gastronomia / e-commerce / IT), budżet startowy (presety).
2. **Symulacja** – 12 miesięcy w 6–8 turach: gotówka, rezerwa, portfel (lokata/obligacje/ETF), cash flow.
3. **Budynki i lekcje** – budynek = dziedzina finansów (płynność, inwestowanie, podatki, rozwój).
   Mikro-lekcja (2–3 zdania + pytanie) podnosi poziom budynku (1–3) i daje bonus w symulacji.
4. **Zdarzenia TAK/NIE** – w każdej turze karta zdarzenia z puli branży, decyzja przesunięciem/przyciskiem.
5. **Podsumowanie** – wykres gotówki i portfela, ścieżka gracza vs ostrożna vs agresywna, zdobyte pojęcia.

Cel na demo: **jedna kompletna misja od onboardingu do podsumowania**, bez błędów, na stałym seedzie.

## Architektura

React + Vite + TypeScript, Tailwind CSS, Zustand, Recharts, Vitest. **Bez backendu** – wszystkie dane w JSON.

```
src/
├── types/game.ts         WSPÓLNY kontrakt danych (typy + sygnatury funkcji silnika)
├── engine/               czysta logika TS: stan → decyzja/zdarzenie/lekcja → nowy stan (+ testy)
├── data/                 JSON-y: presets, buildings, lessons, events + index.ts (import z typami)
├── store/                Zustand: łączy silnik z UI
├── components/screens/   ekrany: Onboarding, Dashboard/Tura, Karta zdarzenia, Modal lekcji, Podsumowanie
├── components/city/      wizualizacja miasta (kafelki/SVG) + wykresy Recharts
├── App.tsx               przełączanie ekranów
└── main.tsx, index.css   start aplikacji, Tailwind
```

Przepływ danych: **UI → store → engine → nowy stan → store → UI.**
UI nigdy nie liczy finansów sam – zawsze wywołuje funkcję silnika przez store.

## Podział pracy – KTO CO EDYTUJE

**Twarda zasada: każda instancja AI modyfikuje TYLKO swoje foldery.**
Jeśli zadanie wymaga zmiany poza nimi – nie zmieniaj, tylko opisz człowiekowi, co i dlaczego trzeba zmienić.

| AI | Rola | Gałąź | Twoje pliki |
|---|---|---|---|
| **AI 1** | Silnik symulacji i dane | `engine` | `src/engine/**`, `src/data/**` |
| **AI 2** | Store i ekrany | `screens` | `src/store/**`, `src/components/screens/**`, `src/App.tsx` |
| **AI 3** | Miasto i wykresy | `city` | `src/components/city/**`, `public/**` |

Szczegóły ról:
- **AI 1 – silnik i dane:** implementuje sygnatury z `game.ts` (`createInitialState`, `drawEvent`, `step`,
  `completeLesson`, `simulateAlternatives`). Deterministyczny generator losowy z seedem
  (ten sam seed = to samo demo). Czyste funkcje bez Reacta, bez mutowania stanu. Testy Vitest obok kodu
  (`*.test.ts`). Eksport publiczny z `src/engine/index.ts`.
  Utrzymuje też JSON-y w `src/data/` (lekcje, zdarzenia, presety, budynki) na podstawie treści od osoby
  odpowiedzialnej za finanse; liczby kalibruje tak, żeby skutek każdej decyzji był widoczny w 1–2 turach.
  Max 2 zdania na ekran. `src/data/data.test.ts` musi przechodzić.
- **AI 2 – store i ekrany:** store Zustand wywołuje funkcje z `src/engine`, ekrany czytają stan ze store.
  Dopóki silnik nie istnieje, używaj tymczasowego mocka w `src/store/` zgodnego z `game.ts`.
- **AI 3 – miasto i wykresy:** komponenty dostają dane przez **propsy** (np. `GameState`, `Snapshot[]`,
  `StrategyPath[]`), nie czytają store bezpośrednio – dzięki temu da się je rozwijać na sztucznych danych.
  Najpierw proste kafelki/SVG; ozdobniki dopiero gdy misja działa end-to-end.

## Pliki wspólne – zmiany tylko po uzgodnieniu

- **`src/types/game.ts` – ZAKAZ zmian bez uzgodnienia z całym zespołem.** To kontrakt, na którym
  opierają się wszystkie 3 instancje. Potrzebujesz zmiany? Zatrzymaj się, opisz ją człowiekowi;
  po zgodzie zespołu wchodzi osobnym, małym PR-em, zanim ktokolwiek zacznie z niej korzystać.
- `package.json` (nowe biblioteki), `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`,
  `src/index.css`, `CLAUDE.md`, `PLAN.md`, `README.md`.

## Komendy

```bash
npm install         # instalacja zależności (po każdym git pull, jeśli zmienił się package.json)
npm run dev         # dev serwer: http://localhost:5173
npm test            # testy Vitest (jednorazowo)
npm run test:watch  # testy w trybie obserwowania
npm run build       # typecheck + build produkcyjny – musi przejść przed każdym PR
```

## Git

- **Nigdy nie commituj ani nie pushuj na `main`.** Pracuj na swojej gałęzi z tabeli.
- Przed zadaniem: `git pull origin main` i wciągnij zmiany do swojej gałęzi.
- Małe commity, opis po polsku w trybie rozkazującym, np. `Dodaj ekran karty zdarzenia`.
- Gdy zadanie działa, a `npm test` i `npm run build` przechodzą: push + Pull Request do `main`.
  **Merge robi człowiek.** `main` zawsze działa i jest zdeployowany na Vercel.
- Nie commituj `.env`, `node_modules/`, `dist/`.

## Zasady kodu

- TypeScript strict, bez `any`. Typy domenowe tylko z `src/types/game.ts`.
- Dane gry importuj z `src/data/index.ts`, nie bezpośrednio z plików JSON.
- Teksty w interfejsie i w JSON-ach po angielsku (jury międzynarodowe); komentarze w kodzie mogą być po polsku.
- Kwoty jako liczby całkowite, procenty jako ułamki (0.05 = 5%).
- Proste > sprytne. Jedna dopracowana ścieżka na demo jest ważniejsza niż wiele niedokończonych funkcji.

Aktualne zadania i właściciele: `PLAN.md`.
