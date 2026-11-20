# FlowCity

**Your city is your company.** A financial simulation game where every building is a part of your
finances — learn a concept, upgrade the building, and watch your decisions shape the city.

Built at Collabothon 2026 for the **Finance Quest** challenge by Commerzbank.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

```bash
npm test        # engine and data tests
npm run build   # production build
```

## Tech stack

React · Vite · TypeScript · Tailwind CSS · Zustand · Recharts · Vitest — no backend, all game content in JSON.

## Project structure

```
src/
├── types/game.ts         shared data contract
├── engine/               simulation logic + tests
├── data/                 lessons, events, presets, buildings (JSON)
├── store/                Zustand game store
├── components/screens/   onboarding, turn, event card, lesson, summary
└── components/city/      city visualisation and charts
```
