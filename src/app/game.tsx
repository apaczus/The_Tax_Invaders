import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DebtsCard } from "../components/DebtsCard";
import { EndScreen } from "../components/EndScreen";
import { LogCard } from "../components/LogCard";
import { MissionCard } from "../components/MissionCard";
import { BriefModal, EventModal, ResultModal } from "../components/Modals";
import { OperationForm, OperationsList } from "../components/Operations";
import { Scene } from "../components/Scene";
import { StatsPanel } from "../components/StatsPanel";
import { Toasts } from "../components/Toasts";
import { Button, Overlay } from "../components/ui";
import { availableOperations, currentLevel, evaluateGoals, industryOf, totalLevels, type OperationId } from "../engine";
import { useGame } from "../store/gameStore";

export default function GameScreen() {
  const { hydrated, game, close, resetAll } = useGame();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [menuOpen, setMenuOpen] = useState(false);
  const [op, setOp] = useState<OperationId | null>(null);

  useEffect(() => {
    if (hydrated && !game) router.replace("/onboarding");
  }, [hydrated, game]);
  if (!game) return null;

  if (game.phase === "end") {
    return (
      <SafeAreaView className="flex-1 bg-paper">
        <EndScreen game={game} />
      </SafeAreaView>
    );
  }

  const lv = currentLevel(game);
  const I = industryOf(game.profile.industry);
  const allGreen = evaluateGoals(game).every((g) => g.ok);
  const pickOp = (id: OperationId) => {
    setMenuOpen(false);
    setOp(id);
  };

  const header = (
    <View className="flex-row items-center gap-3 mb-3">
      <View className="flex-1">
        <Text className="text-xs font-bold text-ink-mute">
          {I.icon} {game.profile.firmName || I.type} · {game.profile.name}
        </Text>
        <Text className="text-xl font-extrabold text-ink">
          Miesiąc {lv.n}/{totalLevels()} · {lv.title}
        </Text>
      </View>
      <View className="bg-gold/20 rounded-full px-3 py-1">
        <Text className="font-extrabold text-ink text-xs">⭐ {game.xp} XP</Text>
      </View>
    </View>
  );

  const closeButton = (
    <Button
      title={allGreen ? "Zamknij miesiąc ✅" : "Zamknij miesiąc"}
      variant={allGreen ? "primary" : "secondary"}
      compact={!wide}
      onPress={close}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <View className="flex-1 flex-row">
        {wide ? (
          <View className="w-72 border-r border-black/5 bg-white">
            <ScrollView contentContainerClassName="p-3">
              <Text className="text-lg font-extrabold text-brand-dark px-2 mb-2">💸 Operacje</Text>
              <OperationsList game={game} onPick={pickOp} />
              <Pressable onPress={resetAll} className="mt-6 px-2">
                <Text className="text-xs text-ink-mute underline">Zacznij od nowa</Text>
              </Pressable>
            </ScrollView>
          </View>
        ) : null}

        <ScrollView className="flex-1" contentContainerClassName={`p-4 ${wide ? "" : "pb-28"}`}>
          {wide ? (
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                {header}
                <Scene game={game} />
              </View>
              <View className="w-[440px]">
                <StatsPanel game={game} />
              </View>
            </View>
          ) : (
            <>
              {header}
              <StatsPanel game={game} />
              <View className="h-3" />
              <Scene game={game} />
            </>
          )}
          <View className={wide ? "flex-row gap-4 mt-0" : "mt-3 gap-3"}>
            <View className={wide ? "flex-1 gap-4" : "gap-3"}>
              <MissionCard game={game} />
              {wide ? closeButton : null}
              <DebtsCard game={game} />
            </View>
            <View className={wide ? "w-[440px]" : ""}>
              <LogCard game={game} />
            </View>
          </View>
          {!wide ? (
            <Pressable onPress={resetAll} className="mt-6 items-center">
              <Text className="text-xs text-ink-mute underline">Zacznij od nowa</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>

      {!wide ? (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-black/10 px-4 pt-3 pb-6 flex-row gap-3">
          <Button className="flex-1" compact variant="secondary" title={`☰ Operacje (${availableOperations(game).length})`} onPress={() => setMenuOpen(true)} />
          <View className="flex-1">{closeButton}</View>
        </View>
      ) : null}

      {menuOpen && !wide ? (
        <Overlay position="bottom" onClose={() => setMenuOpen(false)}>
          <View className="p-4">
            <View className="w-10 h-1.5 bg-black/15 rounded-full self-center mb-3" />
            <Text className="text-lg font-extrabold text-brand-dark mb-2 px-2">💸 Operacje</Text>
            <ScrollView style={{ maxHeight: 520 }}>
              <OperationsList game={game} onPick={pickOp} />
            </ScrollView>
          </View>
        </Overlay>
      ) : null}

      {op && game.phase === "play" ? (
        <Overlay position={wide ? "center" : "bottom"} onClose={() => setOp(null)}>
          <OperationForm key={op} game={game} id={op} onDone={() => setOp(null)} />
        </Overlay>
      ) : null}

      {game.phase === "brief" ? <BriefModal game={game} /> : null}
      {game.phase === "event" && game.month.event ? <EventModal game={game} /> : null}
      {game.phase === "result" && game.result ? <ResultModal game={game} /> : null}
      <Toasts />
    </SafeAreaView>
  );
}
