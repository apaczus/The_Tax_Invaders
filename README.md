# Finance Quest – The Tax Invaders

Gra mobilna o finansach dla właścicieli małych firm (Collabothon 2026, wyzwanie Commerzbank „Finance Quest”).
Użytkownik opisuje siebie i swoją firmę, a potem przez 5 miesięcy (5 leveli) prowadzi firmę i własne finanse:
**długi → poduszka → rozwój firmy → ubezpieczenia → inwestycje**. Każdy level kończy się lekcją (sukces)
albo wyjaśnieniem, co poszło nie tak i jak to naprawić (powtórka miesiąca).

## Uruchomienie

```bash
npm install
npm start          # Expo – zeskanuj QR w aplikacji Expo Go (telefon)
npm run web        # wersja w przeglądarce
npm test           # testy silnika gry
npm run typecheck
npm run build:web  # statyczny eksport do dist/ (link dla jury)
```

## Architektura

| Warstwa | Gdzie | Co robi |
|---|---|---|
| Dane gry (JSON) | `src/data/` | kwoty, branże, długi, ubezpieczenia, operacje, levele, cele, zdarzenia losowe, lekcje, pytania onboardingu – **edytowalne bez kodu** |
| Silnik (czysty TypeScript) | `src/engine/` | pętla miesiąca, operacje, zdarzenia, warunki wygranej/porażki, powtórka levelu. Bez Reacta, deterministyczne losowanie, testy w `engine.test.ts` |
| Stan | `src/store/gameStore.ts` | Zustand + zapis w AsyncStorage (web: localStorage) |
| UI | `src/app/` (Expo Router), `src/components/` | onboarding, panel gry, operacje, zdarzenia, lekcje. NativeWind (Tailwind) + Reanimated |

Stack: Expo SDK 58 (React Native 0.88), TypeScript, Expo Router, NativeWind 4, Zustand, Reanimated 4, Vitest.

### Jak zmienić grę bez programowania
- **Kwoty startowe, koszty, przychody** → `src/data/economy.json`
- **Długi z ankiety** (saldo, oprocentowanie miesięczne, rata) → `src/data/debts.json`
- **Levele, cele, lekcje** → `src/data/levels.json` + teksty celów w `src/data/goals.json`
- **Zdarzenia losowe** (awaria auta, spadek, …) → `src/data/events.json`; które mogą wypaść na danym levelu → pole `events` w `levels.json`
- **Branże** (nazwy, teksty, ikonki rozwoju firmy) → `src/data/industries.json`
- **Pytania onboardingu** → `src/data/onboarding.json`

Po zmianie uruchom `npm test`, żeby sprawdzić, czy level 1 nadal da się przejść.

## Link dla jury (GitHub Pages)
Workflow `.github/workflows/web.yml` po merge'u do `main` buduje wersję web i publikuje ją na GitHub Pages.
Jednorazowo trzeba włączyć: *Settings → Pages → Source: GitHub Actions*.
