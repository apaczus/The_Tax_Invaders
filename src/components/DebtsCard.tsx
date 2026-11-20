import { Text, View } from "react-native";
import { debtPayment, fmt, yearly, type GameState } from "../engine";
import { Card, Pill, SectionTitle } from "./ui";

export function DebtsCard({ game }: { game: GameState }) {
  const empty = !game.debts.length && !game.overdue.length;
  return (
    <Card>
      <SectionTitle>Długi i zaległości</SectionTitle>
      {empty ? <Text className="text-ink-soft">Brak długów i zaległości 🙌</Text> : null}
      {game.overdue.map((o) => (
        <View key={o.id} className="flex-row items-center py-1.5 gap-2">
          <Text className="flex-1 text-ink">🔴 {o.name}</Text>
          <Pill tone="bad">{o.owner === "firm" ? "firma" : "Ty"}</Pill>
          <Text className="font-bold text-bad w-24 text-right">{fmt(o.amount)}</Text>
        </View>
      ))}
      {game.debts.map((d) => (
        <View key={d.id} className="flex-row items-center py-1.5 gap-2">
          <View className="flex-1">
            <Text className="text-ink">{d.name}</Text>
            <Text className="text-[11px] text-ink-mute">
              {yearly(d.rate)} rocznie · rata {fmt(debtPayment(d))}
            </Text>
          </View>
          {d.kind === "expensive" ? <Pill tone="bad">drogi</Pill> : d.kind === "zero" ? <Pill tone="good">0%</Pill> : null}
          <Text className="font-bold text-ink w-24 text-right">{fmt(d.balance)}</Text>
        </View>
      ))}
    </Card>
  );
}
