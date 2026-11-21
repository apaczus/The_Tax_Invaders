# Finance Quest – The Tax Invaders · instrukcja dla Claude'a

Przeczytaj ten plik w całości, zanim cokolwiek zmienisz. Obowiązuje każdą instancję Claude'a w zespole.

Hackathon Collabothon 2026, wyzwanie **Finance Quest** (Commerzbank). Oddanie: niedziela 09:00.
Gra o finansach dla właścicieli małych firm: ankieta o graczu i firmie, potem 5 miesięcy (5 leveli):
**długi → poduszka → rozwój firmy → ubezpieczenia → inwestycje**. Każdy level kończy się lekcją.

Link dla jury (na górze README): https://finance-quest.expo.app

## Najważniejsza zasada

**`main` musi zawsze działać.** Z niego robimy link dla jury. Nigdy nie commituj ani nie pushuj na `main`.
Pracuj na własnej gałęzi → Pull Request → merge robi człowiek.

## Stack i struktura

Expo SDK 58 (React Native 0.88) + Expo Router, TypeScript, NativeWind 4 (Tailwind), Zustand, Reanimated 4, Vitest.
Jedna baza kodu działa na telefonie (Expo Go) i w przeglądarce. **Bez backendu** – treść gry w JSON.

| Warstwa | Gdzie | Zasada |
|---|---|---|
| Treść i liczby | `src/data/*.json` | Kwoty, teksty, levele, cele, zdarzenia, lekcje, branże, pytania ankiety. Zmiana treści = zmiana JSON-a, nie kodu. |
| Silnik | `src/engine/` | Czysty TypeScript, **bez Reacta**. Funkcje nie mutują stanu wejściowego (zwracają kopię). Losowość tylko przez `rng.ts` (deterministyczny seed). |
| Typy | `src/engine/types.ts` | Wspólny kontrakt – patrz „Pliki wspólne”. |
| Dostęp do danych | `src/engine/content.ts` | Typowany import JSON-ów. Reszta kodu bierze dane stąd, nie z JSON-ów bezpośrednio. |
| Stan | `src/store/gameStore.ts` | Zustand + zapis w AsyncStorage (web: localStorage, klucz `finance-quest-v1`). Woła funkcje silnika. |
| Ekrany | `src/app/` | `onboarding.tsx` (ankieta), `game.tsx` (panel gry), `index.tsx` (przekierowanie). |
| Komponenty | `src/components/` | `Modals.tsx` (brief, zdarzenie, wynik/lekcja), `Operations.tsx`, `MissionCard.tsx`, `Scene.tsx` (wizualizacja firmy), `StatsPanel.tsx`, `EndScreen.tsx`, `ui.tsx` (przyciski, karty). |

Przepływ: **UI → store → silnik → nowy stan → store → UI.** UI nigdy nie liczy finansów samo.

## Podział pracy (według etapów gry)

| Osoba | Etap | Główne pliki |
|---|---|---|
| 1 | Wejście: ankieta i punkt startowy | `src/app/onboarding.tsx`, `src/data/onboarding.json`, `src/components/StartSummary.tsx`, `createGame`/`emptyProfile` w `src/engine/game.ts` |
| 2 | Rozgrywka: miesiące, operacje, zdarzenia, lekcje | `src/app/game.tsx`, `src/data/levels.json`, `events.json`, `operations.json`, `goals.json`, `src/engine/operations.ts`, `goals.ts`, `src/components/Operations.tsx`, `Modals.tsx`, `MissionCard.tsx` |
| 3 | Efekty i koniec: wizualizacja, panel liczb, podsumowanie | `src/components/Scene.tsx`, `StatsPanel.tsx`, `EndScreen.tsx`, `LogCard.tsx`, nowe wykresy |

Edytuj przede wszystkim pliki swojego etapu. Jeśli zadanie wymaga zmian w cudzym etapie – powiedz o tym
człowiekowi, zanim je zrobisz.

## Pliki wspólne – zmiany tylko po uzgodnieniu z zespołem

- `src/engine/types.ts` (kontrakt danych), `src/store/gameStore.ts`, główna pętla w `src/engine/game.ts`
- `package.json` / `package-lock.json` (nowe biblioteki), `app.json`, `app.config.js`, `babel.config.js`,
  `metro.config.js`, `tailwind.config.js`, `tsconfig.json`, `.github/workflows/`, `CLAUDE.md`, `README.md`

Zmiana kształtu `GameState` musi zachować działanie starych zapisów gry z localStorage
(nowe pola opcjonalne albo z wartością domyślną przy wczytaniu).

## Komendy

Na Windows w PowerShellu skrypty `npm` bywają zablokowane – używaj wtedy `npm.cmd` / `npx.cmd`.

```bash
npm install                        # po każdym git pull, jeśli zmienił się package.json
npm run web                        # gra w przeglądarce: http://localhost:8081
npm start                          # Expo Go na telefonie (QR); poza siecią lokalną: npx expo start --tunnel
npm run typecheck                  # sprawdzenie typów
npm test                           # testy silnika i spójności danych (Vitest)
npm run build:web                  # eksport wersji web do dist/ (to samo robi CI)
```

## Zanim powiesz, że zadanie jest gotowe

Claude nie sprawdza tego sam z siebie – **zrób to za każdym razem przed commitem**:

1. `npm run typecheck` – bez błędów.
2. `npm test` – wszystkie testy przechodzą. Zmieniasz zachowanie silnika → dopisz lub popraw test.
3. `npm run build:web` – eksport przechodzi (bez tego link dla jury się nie zbuduje).
4. Zmiana widoczna dla gracza → uruchom `npm run web` i sprawdź ją w przeglądarce, bez błędów w konsoli.
5. Napisz człowiekowi wprost, czego **nie** sprawdziłeś.

Zmieniasz `src/data/*.json`? `src/engine/events.test.ts` pilnuje m.in., żeby zdarzenia z `levels.json`
istniały, a teksty nie miały niepodmienionych `{zmiennych}` w żadnej branży – musi przechodzić.

## Git krok po kroku

1. `git switch main` → `git pull origin main` → `git switch -c <krótka-nazwa-zadania>`
2. Małe commity, opis po polsku w trybie rozkazującym, np. `Dodaj karty TAK/NIE do levelu 2`.
3. Gotowe i sprawdzone (patrz wyżej) → `git push -u origin <gałąź>` → Pull Request do `main`
   z opisem: co zmieniono, jak sprawdzono, czego nie sprawdzono.
4. GitHub Actions automatycznie uruchamia typecheck, testy i eksport web dla każdego PR-a.
   Czerwony check = nie mergujemy.
5. **Merge robi człowiek.** Nie mergeuj sam, nie używaj `--force`, nie przepisuj historii `main`.
6. Konflikt przy merge'u: nie nadpisuj cudzych zmian – połącz obie wersje i pokaż człowiekowi wynik.
7. Nigdy nie commituj `node_modules/`, `dist/`, `.expo/`, plików `.env` ani kluczy.

## Treść i styl

- Teksty w grze po polsku, zwięźle: **max 2 zdania** na ekran w zdarzeniach i lekcjach.
- Kwoty w zł jako liczby całkowite w JSON-ach (`src/data/economy.json` itd.), nie w kodzie.
- Teksty zależne od branży: placeholdery `{klucz}` w `events.json` + pola w `industries.json`
  (klucz musi być przekazany w `eventText` w `src/engine/game.ts`).
- Każde zdarzenie powinno czegoś uczyć – pole `lesson` w `events.json`.

## Publikacja linku dla jury

Link https://finance-quest.expo.app (Expo Hosting) **nie aktualizuje się sam**. Publikuje właściciel projektu
Expo (konto `jakubsaciuk`) po merge'u do `main`:
`npx expo export --platform web` → `npx eas-cli deploy --prod`.
GitHub Pages (`.github/workflows/web.yml`) jest skonfigurowany, ale wyłączony w ustawieniach repo.
