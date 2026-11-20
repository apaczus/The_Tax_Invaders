// Tymczasowy ekran startowy – do podmiany przez AI 2 (ekrany) na prawdziwy przepływ gry.
import { buildings, events, lessons, presets } from './data'

export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-4xl font-bold">FlowCity</h1>
        <p className="text-slate-400">Your city is your company. Learn. Grow. Compete.</p>
        <ul className="grid grid-cols-2 gap-3 text-sm">
          <li className="rounded-xl bg-slate-900 p-3">{presets.generations.length} profiles</li>
          <li className="rounded-xl bg-slate-900 p-3">{presets.industries.length} industries</li>
          <li className="rounded-xl bg-slate-900 p-3">{buildings.length} buildings</li>
          <li className="rounded-xl bg-slate-900 p-3">
            {lessons.length} lessons · {events.length} events
          </li>
        </ul>
        <p className="text-xs text-slate-500">Skeleton is running ✔</p>
      </div>
    </main>
  )
}
