import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useGame } from "../store/gameStore";

export default function Index() {
  const hydrated = useGame((s) => s.hydrated);
  const game = useGame((s) => s.game);
  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator />
      </View>
    );
  }
  return <Redirect href={game ? "/game" : "/onboarding"} />;
}
