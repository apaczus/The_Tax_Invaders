# Finance Quest – The Tax Invaders

## ▶️ Zagraj w przeglądarce / Play in your browser

### **https://apaczus.github.io/The_Tax_Invaders/**

Nic nie trzeba instalować – link działa na komputerze i na telefonie.
No installation needed – works on desktop and mobile browsers.

Zapasowy link / Backup link: https://finance-quest.expo.app

**Collabothon 2026 · Commerzbank challenge „Finance Quest”**

| | |
|---|---|
| **Dla kogo / Target learner** | Właściciele małych firm, którzy mieszają finanse firmy i prywatne / Small business owners who mix business and personal finances |
| **Cel nauki / Learning goal** | Kolejność zdrowych finansów: długi → poduszka → rozwój firmy → ubezpieczenia → inwestycje / The order of healthy finances: debt → emergency cushion → growth → insurance → investing |
| **Jak gramy / How it works** | Krótka ankieta o Tobie i firmie, potem 5 miesięcy (5 leveli) decyzji, losowych zdarzeń i mikro-lekcji / A short questionnaire, then 5 months (levels) of decisions, random events and micro-lessons |
---

Gra mobilna o finansach dla właścicieli małych firm (Collabothon 2026, wyzwanie Commerzbank „Finance Quest”).
Użytkownik opisuje siebie i swoją firmę, a potem przez 5 miesięcy (5 leveli) prowadzi firmę i własne finanse:
**długi → poduszka → rozwój firmy → ubezpieczenia → inwestycje**. Każdy level kończy się lekcją (sukces)
albo wyjaśnieniem, co poszło nie tak i jak to naprawić (powtórka miesiąca).

## Uruchomienie lokalne

Wymagany Node.js 20+. Na Windows w PowerShellu używaj `npm.cmd` zamiast `npm`, jeśli skrypty są zablokowane.

```bash
git clone https://github.com/apaczus/The_Tax_Invaders.git
cd The_Tax_Invaders
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

## Publikacja (GitHub Pages)
Workflow `.github/workflows/web.yml` po każdym merge'u do `main` uruchamia testy, buduje wersję web
i publikuje ją pod https://apaczus.github.io/The_Tax_Invaders/ – link aktualizuje się sam.
Jednorazowo (właściciel repo): repo publiczne + *Settings → Pages → Source: GitHub Actions*.
