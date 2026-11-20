// NativeWind: pozwala używać className na komponentach Reanimated (animacje lekcji i przejść).
import { cssInterop } from "nativewind";
import Animated from "react-native-reanimated";

cssInterop(Animated.View, { className: "style" });
cssInterop(Animated.Text, { className: "style" });
