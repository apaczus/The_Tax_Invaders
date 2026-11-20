import { Text, View } from "react-native";
import { currentLevel, evaluateGoals, type GameState } from "../engine";
import { Card } from "./ui";

export function MissionCard({ game }: { game: GameState }) {
  const lv = currentLevel(game);
  const goals = evaluateGoals(game);
  const done = goals.filter((g) => g.ok).length;
  return (
    <Card>
      <View className="flex-row items-center gap-3 mb-3">
        <Text className="text-3xl">{lv.icon}</Text>
        <View className="flex-1">
          <Text className="text-xs font-bold text-ink-mute">MISJA · LEVEL {lv.n}</Text>
          <Text className="text-lg font-extrabold text-ink">{lv.title}</Text>
        </View>
        <Text className="text-sm font-bold text-brand">
          {done}/{goals.length}
        </Text>
      </View>
      {goals.map((g) => (
        <View key={g.id} className="flex-row gap-2 py-1.5">
          <Text className={`text-base ${g.ok ? "text-good" : "text-ink-mute"}`}>{g.ok ? "✅" : "⬜"}</Text>
          <View className="flex-1">
            <Text className={`font-semibold ${g.ok ? "text-ink" : "text-ink"}`}>{g.label}</Text>
            <Text className="text-xs text-ink-mute">{g.detail}</Text>
          </View>
        </View>
      ))}
    </Card>
  );
}
