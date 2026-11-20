/**
 * Jedno miejsce importu danych gry z typami z src/types/game.ts.
 * Reszta aplikacji importuje dane STĄD, nie bezpośrednio z plików JSON.
 */
import type { BuildingsData, EventsData, LessonsData, Presets } from '../types/game'
import presetsJson from './presets.json'
import buildingsJson from './buildings.json'
import lessonsJson from './lessons.json'
import eventsJson from './events.json'

export const presets = presetsJson as Presets
export const buildings = (buildingsJson as BuildingsData).buildings
export const lessons = (lessonsJson as LessonsData).lessons
export const events = (eventsJson as EventsData).events
