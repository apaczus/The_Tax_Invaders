import { Text, View } from "react-native";
import { fmt, keyStats, type GameState } from "../engine";

function Stat({ label, value, tone }: { label: string; value: number; tone?: "bad" | "good" | "auto" }) {
  const color = tone === "bad" && value > 0 ? "text-bad" : tone === "auto" ? (value < 0 ? "text-bad" : "text-good") : "text-ink";
  return (
    <View className="flex-row justify-between items-baseline py-0.5">
      <Text className="text-ink-soft text-xs">{label}</Text>
      <Text className={`font-bold text-sm ${color}`}>{fmt(value)}</Text>
    </View>
  );
}

/** Najważniejsze liczby firmy i Twoich finansów (prawy górny róg / góra ekranu). */
export function StatsPanel({ game }: { game: GameState }) {
  const k = keyStats(game);
  return (
    <View className="flex-row gap-2">
      <View className="flex-1 bg-white rounded-2xl p-3 border border-black/5">
        <Text className="text-xs font-extrabold text-brand-dark mb-1">🏪 FIRMA</Text>
        <Stat label="Stan konta" value={k.firmCash} />
        <Stat label="Przychody" value={k.firmIncome} />
        <Stat label="Wydatki" value={k.firmExpenses} />
        <Stat label="Zaległości" value={k.firmOverdue} tone="bad" />
        {k.firmReserve > 0 ? <Stat label="Rezerwa" value={k.firmReserve} /> : null}
        <View className="border-t border-black/5 mt-1 pt-1">
          <Stat label="Na koniec mies." value={k.firmForecast} tone="auto" />
        </View>
      </View>
      <View className="flex-1 bg-white rounded-2xl p-3 border border-black/5">
        <Text className="text-xs font-extrabold text-brand-dark mb-1">🙂 TY</Text>
        <Stat label="Stan konta" value={k.meCash} />
        <Stat label="Pensja" value={k.meIncome} />
        <Stat label="Wydatki" value={k.meExpenses} />
        <Stat label="Zaległości" value={k.meOverdue} tone="bad" />
        {k.meSavings > 0 ? <Stat label="Poduszka" value={k.meSavings} /> : null}
        <View className="border-t border-black/5 mt-1 pt-1">
          <Stat label="Na koniec mies." value={k.meForecast} tone="auto" />
        </View>
      </View>
    </View>
  );
}
