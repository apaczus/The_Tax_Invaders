import { router } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Choice } from "../components/ui";
import { StartSummary } from "../components/StartSummary";
import { DEBTS, INDUSTRIES, ONBOARDING, type OnboardingOption, type OnboardingQuestion, type Profile } from "../engine";
import { useGame } from "../store/gameStore";

function optionsFor(q: OnboardingQuestion, draft: Profile): OnboardingOption[] {
  let opts: OnboardingOption[] = q.options ?? [];
  if (q.source === "industries") opts = Object.entries(INDUSTRIES).map(([value, v]) => ({ value, label: v.label, hint: v.type, icon: v.icon }));
  if (q.source === "debts") opts = Object.entries(DEBTS).map(([value, d]) => ({ value, label: d.label, hint: d.hint, icon: d.icon }));
  opts = [...opts, ...(q.extraOptions ?? [])];
  return opts.filter((o) => !o.showIf || Object.entries(o.showIf).every(([k, v]) => (draft as unknown as Record<string, unknown>)[k] === v));
}

function missing(q: OnboardingQuestion, draft: Profile): boolean {
  if (!q.required) return false;
  const v = (draft as unknown as Record<string, unknown>)[q.field];
  return Array.isArray(v) ? v.length === 0 : !String(v ?? "").trim();
}

export default function Onboarding() {
  const { hydrated, draft, setDraft, onboardingStep: step, setOnboardingStep, startGame, game } = useGame();
  useEffect(() => {
    if (hydrated && game) router.replace("/game");
  }, [hydrated, game]);

  const cur = ONBOARDING[step];
  const isLast = step === ONBOARDING.length - 1;
  const blocked = cur.questions.some((q) => missing(q, draft));
  const field = (k: string) => (draft as unknown as Record<string, unknown>)[k];

  const pickSingle = (q: OnboardingQuestion, v: string) => setDraft({ [q.field]: v } as Partial<Profile>);
  const pickMulti = (q: OnboardingQuestion, v: string) => {
    const cur = (field(q.field) as string[]) ?? [];
    let next: string[];
    if (v === q.noneValue) next = cur.includes(v) ? [] : [v];
    else next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur.filter((x) => x !== q.noneValue), v];
    setDraft({ [q.field]: next } as Partial<Profile>);
  };

  const next = () => {
    if (isLast) {
      startGame();
      router.replace("/game");
    } else setOnboardingStep(step + 1);
  };

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <View className="px-5 pt-3 pb-2 flex-row items-center gap-2">
        <Text className="text-xl font-extrabold text-brand-dark">💸 Finance Quest</Text>
        <View className="flex-1" />
        <Text className="text-ink-mute text-xs">
          Krok {step + 1}/{ONBOARDING.length}
        </Text>
      </View>
      <View className="h-1.5 mx-5 bg-black/5 rounded-full overflow-hidden">
        <View className="h-full bg-brand" style={{ width: `${((step + 1) / ONBOARDING.length) * 100}%` }} />
      </View>
      <ScrollView contentContainerClassName="p-5 pb-10 w-full max-w-2xl self-center">
        <Animated.View key={cur.id} entering={FadeInRight.duration(250)}>
          <Text className="text-2xl font-extrabold text-ink mt-2">{cur.title}</Text>
          <Text className="text-ink-soft mt-2 mb-5 leading-5">{cur.sub}</Text>

          {cur.questions.map((q) => (
            <View key={q.field} className="mb-5">
              {q.label ? <Text className="font-bold text-ink mb-2">{q.label}</Text> : null}
              {q.type === "text" ? (
                <TextInput
                  value={String(field(q.field) ?? "")}
                  onChangeText={(t) => setDraft({ [q.field]: t } as Partial<Profile>)}
                  placeholder={q.placeholder}
                  placeholderTextColor="#8A979E"
                  multiline={q.multiline}
                  className={`bg-white border border-black/10 rounded-xl px-3 py-3 text-base text-ink ${q.multiline ? "min-h-[80px]" : ""}`}
                />
              ) : (
                optionsFor(q, draft).map((o) => {
                  const v = field(q.field);
                  const selected = Array.isArray(v) ? v.includes(o.value) : v === o.value;
                  return (
                    <Choice
                      key={o.value}
                      selected={selected}
                      label={o.label}
                      hint={o.hint}
                      icon={o.icon}
                      onPress={() => (q.type === "multi" ? pickMulti(q, o.value) : pickSingle(q, o.value))}
                    />
                  );
                })
              )}
            </View>
          ))}

          {cur.id === "summary" ? <StartSummary profile={draft} /> : null}
        </Animated.View>

        <View className="flex-row gap-3 mt-4">
          {step > 0 ? <Button title="Wstecz" variant="ghost" onPress={() => setOnboardingStep(step - 1)} /> : null}
          <Button className="flex-1" title={isLast ? "Zaczynamy grę 🚀" : "Dalej"} disabled={blocked} onPress={next} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
