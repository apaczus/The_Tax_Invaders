import { Pressable, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOut } from "react-native-reanimated";
import { useGame } from "../store/gameStore";

export function Toasts() {
  const { toasts, dismissToast } = useGame();
  return (
    <View pointerEvents="box-none" className="absolute top-3 left-0 right-0 items-center z-[60] px-4 gap-2">
      {toasts.map((t) => (
        <Animated.View key={t.id} entering={FadeInUp} exiting={FadeOut} className="w-full max-w-md">
          <Pressable onPress={() => dismissToast(t.id)} className="bg-ink rounded-2xl px-4 py-3">
            <Text className="text-white font-semibold">{t.text}</Text>
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}
