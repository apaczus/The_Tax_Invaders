import { Text, View } from "react-native";
import { fmtSigned, type GameState } from "../engine";
import { Card, SectionTitle } from "./ui";

export function LogCard({ game }: { game: GameState }) {
  const items = game.log.filter((l) => l.level === game.level).slice(0, 12);
  return (
    <Card>
      <SectionTitle>Historia miesiąca</SectionTitle>
      {items.map((l, i) => (
        <View key={i} className="flex-row py-1 gap-2">
          <Text className="text-xs">{l.account === "firm" ? "🏪" : "🙂"}</Text>
          <Text className="flex-1 text-xs text-ink-soft">{l.text}</Text>
          {l.amount ? (
            <Text className={`text-xs font-bold ${l.amount < 0 ? "text-bad" : "text-good"}`}>{fmtSigned(l.amount)}</Text>
          ) : null}
        </View>
      ))}
    </Card>
  );
}
