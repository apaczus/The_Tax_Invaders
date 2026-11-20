import { type ReactNode } from "react";
import { Pressable, Text, View, type PressableProps } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut, ZoomIn } from "react-native-reanimated";

/** Tekst z prostym **pogrubieniem** (z JSON-ów z lekcjami). */
export function Rich({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text className={`text-ink ${className}`}>
      {parts.map((p, i) =>
        p.startsWith("**") ? (
          <Text key={i} className="font-bold">
            {p.slice(2, -2)}
          </Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <View className={`bg-white rounded-2xl p-4 border border-black/5 ${className}`}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text className="text-xs font-bold uppercase tracking-wider text-ink-mute mb-2">{children}</Text>;
}

type Variant = "primary" | "secondary" | "danger" | "ghost";
const variantCls: Record<Variant, [string, string]> = {
  primary: ["bg-brand active:bg-brand-dark", "text-white"],
  secondary: ["bg-brand-light active:opacity-80", "text-brand-dark"],
  danger: ["bg-bad active:opacity-80", "text-white"],
  ghost: ["bg-transparent active:bg-black/5", "text-ink-soft"],
};

export function Button({
  title,
  variant = "primary",
  className = "",
  disabled,
  compact,
  ...rest
}: { title: string; variant?: Variant; className?: string; compact?: boolean } & PressableProps) {
  const [bg, fg] = variantCls[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={`rounded-xl ${compact ? "px-2" : "px-4"} py-3 items-center justify-center ${bg} ${disabled ? "opacity-40" : ""} ${className}`}
      {...rest}
    >
      <Text numberOfLines={1} className={`font-bold ${compact ? "text-sm" : "text-base"} ${fg}`}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Choice({
  selected,
  label,
  hint,
  icon,
  onPress,
}: {
  selected: boolean;
  label: string;
  hint?: string;
  icon?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-xl border-2 px-3 py-3 mb-2 ${
        selected ? "border-brand bg-brand-light" : "border-black/10 bg-white"
      }`}
    >
      {icon ? <Text className="text-2xl">{icon}</Text> : null}
      <View className="flex-1">
        <Text className="text-ink font-semibold">{label}</Text>
        {hint ? <Text className="text-ink-mute text-xs mt-0.5">{hint}</Text> : null}
      </View>
      <Text className={`text-lg ${selected ? "text-brand" : "text-transparent"}`}>✓</Text>
    </Pressable>
  );
}

/** Pełnoekranowa nakładka z kartą – działa tak samo na telefonie i w przeglądarce. */
export function Overlay({
  children,
  onClose,
  position = "center",
}: {
  children: ReactNode;
  onClose?: () => void;
  position?: "center" | "bottom";
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(120)}
      className={`absolute inset-0 bg-black/50 z-50 ${position === "bottom" ? "justify-end" : "justify-center items-center p-4"}`}
    >
      <Pressable className="absolute inset-0" onPress={onClose} accessibilityLabel="Zamknij" />
      <Animated.View
        entering={position === "bottom" ? FadeInDown.duration(220) : ZoomIn.duration(220)}
        className={
          position === "bottom"
            ? "bg-paper rounded-t-3xl max-h-[88%] w-full"
            : "bg-paper rounded-3xl max-h-[92%] w-full max-w-xl"
        }
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "bad" | "warn" | "brand" }) {
  const cls = {
    neutral: "bg-black/5 text-ink-soft",
    good: "bg-good/10 text-good",
    bad: "bg-bad/10 text-bad",
    warn: "bg-warn/15 text-warn",
    brand: "bg-brand-light text-brand-dark",
  }[tone];
  return <Text className={`text-xs font-bold px-2 py-1 rounded-full overflow-hidden ${cls}`}>{children}</Text>;
}
