import { Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { firmStage, fmt, industryOf, netWorth, nextRevenue, type GameState } from "../engine";
import { Card } from "./ui";

/** Wizualizacja: Twoja firma, dom i auto. Firma rośnie razem z dobrymi decyzjami. */
export function Scene({ game }: { game: GameState }) {
  const I = industryOf(game.profile.industry);
  const st = firmStage(game);
  const home = { rent: "🏢", mortgage: "🏡", own: "🏠", family: "👨‍👩‍👧" }[game.profile.housing || "rent"] ?? "🏠";
  const car = { none: "🚌", private: "🚗", firm: "🚐" }[game.profile.car || "none"] ?? "🚌";
  const staff = Array.from({ length: game.firm.staff }, () => "🧑");
  return (
    <Card>
      <View className="flex-row items-end justify-around py-2">
        <View className="items-center">
          <Animated.Text key={st.index} entering={ZoomIn} className="text-6xl">
            {st.icon}
          </Animated.Text>
          <Text className="text-xs font-bold text-ink mt-1" numberOfLines={1}>
            {game.profile.firmName || I.type}
          </Text>
          <Text className="text-[10px] text-ink-mute">{staff.join("")} · {st.name}</Text>
        </View>
        <View className="items-center">
          <Text className="text-4xl">{home}</Text>
          <Text className="text-[10px] text-ink-mute mt-1">Dom</Text>
        </View>
        <View className="items-center">
          <Text className="text-4xl">{car}</Text>
          <Text className="text-[10px] text-ink-mute mt-1">{game.profile.car === "none" ? "Bez auta" : "Auto"}</Text>
        </View>
      </View>
      <View className="mt-3">
        <View className="flex-row justify-between mb-1">
          <Text className="text-xs text-ink-soft">
            Rozwój firmy: <Text className="font-bold">{st.name}</Text>
            {st.next ? ` → ${st.next}` : ""}
          </Text>
          <Text className="text-xs text-ink-soft">Przychód {fmt(nextRevenue(game))}</Text>
        </View>
        <View className="h-2 bg-black/5 rounded-full overflow-hidden">
          <View className="h-full bg-gold" style={{ width: `${Math.max(4, st.progress * 100)}%` }} />
        </View>
        <Text className="text-xs text-ink-soft mt-2">
          Twój majątek netto: <Text className={`font-bold ${netWorth(game) < 0 ? "text-bad" : "text-good"}`}>{fmt(netWorth(game))}</Text>
        </Text>
      </View>
    </Card>
  );
}
