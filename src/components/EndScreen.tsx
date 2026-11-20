import { ScrollView, Text, View } from "react-native";
import Animated, { BounceIn } from "react-native-reanimated";
import { fmt, netWorth, type GameState } from "../engine";
import { useGame } from "../store/gameStore";
import { Button, Card } from "./ui";

export function EndScreen({ game }: { game: GameState }) {
  const resetAll = useGame((s) => s.resetAll);
  const start = game.history[0]?.netWorth ?? 0;
  const now = netWorth(game);
  return (
    <ScrollView contentContainerClassName="p-6 w-full max-w-xl self-center">
      <Animated.Text entering={BounceIn} className="text-7xl text-center mt-6">
        🎉
      </Animated.Text>
      <Text className="text-3xl font-extrabold text-ink text-center mt-3">Przeszedłeś Finance Quest!</Text>
      <Text className="text-ink-soft text-center mt-2">Długi → poduszka → rozwój → ubezpieczenia → inwestycje. Ta kolejność działa też w prawdziwym życiu.</Text>
      <Card className="mt-6">
        <Text className="text-ink">
          Majątek netto na starcie: <Text className="font-bold">{fmt(start)}</Text>
        </Text>
        <Text className="text-ink mt-1">
          Majątek netto teraz: <Text className="font-bold text-good">{fmt(now)}</Text>
        </Text>
        <Text className="text-ink mt-1">
          Zdobyte XP: <Text className="font-bold">{game.xp}</Text>
        </Text>
      </Card>
      <Card className="mt-3">
        <Text className="font-bold text-ink mb-1">Odznaki</Text>
        {game.badges.length ? game.badges.map((b) => <Text key={b}>🏅 {b}</Text>) : <Text className="text-ink-soft">Brak – zagraj jeszcze raz!</Text>}
      </Card>
      <View className="bg-brand-light rounded-2xl p-4 mt-3">
        <Text className="text-brand-dark font-bold">Twój następny krok w realu: sprawdź, czy masz drogi dług. Jeśli tak – zacznij od niego już w tym miesiącu.</Text>
      </View>
      <Button className="mt-6" title="Zagraj od nowa" onPress={resetAll} />
    </ScrollView>
  );
}
