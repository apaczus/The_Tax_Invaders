import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { BounceIn, FadeInDown } from "react-native-reanimated";
import { EVENTS, currentLevel, eventText, fmt, totalLevels, type EventChoice, type GameState } from "../engine";
import { useGame } from "../store/gameStore";
import { Button, Choice, Overlay, Rich } from "./ui";

export function BriefModal({ game }: { game: GameState }) {
  const begin = useGame((s) => s.begin);
  const lv = currentLevel(game);
  const fails = game.lastFails;
  return (
    <Overlay>
      <ScrollView contentContainerClassName="p-6">
        <Text className="text-xs font-bold text-ink-mute">
          MIESIĄC {lv.n} z {totalLevels()}
          {game.month.attempt > 1 ? ` · PODEJŚCIE ${game.month.attempt}` : ""}
        </Text>
        <Animated.Text entering={BounceIn} className="text-6xl my-3">
          {lv.icon}
        </Animated.Text>
        <Text className="text-2xl font-extrabold text-ink">{lv.title}</Text>
        <Text className="text-ink-soft mt-2 leading-5">{lv.brief}</Text>
        {fails?.length ? (
          <View className="bg-warn/10 rounded-2xl p-4 mt-4">
            <Text className="font-extrabold text-ink mb-2">🔁 Tym razem popraw:</Text>
            {fails.map((f) => (
              <View key={f.id} className="mb-2">
                <Text className="font-bold text-ink">• {f.label}</Text>
                <Text className="text-ink-soft text-sm">{f.fix}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <View className="bg-brand-light rounded-2xl p-4 mt-4">
          <Text className="text-brand-dark text-sm">
            Firma dostała przychód za ten miesiąc, a Ty pensję. Użyj operacji z menu, a gdy cele będą zielone – zamknij miesiąc.
          </Text>
        </View>
        <Button className="mt-5" title="Do dzieła 💪" onPress={begin} />
      </ScrollView>
    </Overlay>
  );
}

export function EventModal({ game }: { game: GameState }) {
  const resolve = useGame((s) => s.resolve);
  const [error, setError] = useState<string>();
  const ev = game.month.event!;
  const e = EVENTS[ev.id];
  const pick = (c: EventChoice) => {
    const err = resolve(c);
    if (err) setError(err);
  };
  const tone = e.tone ?? "bad";
  const bg = tone === "good" ? "bg-good/10" : tone === "warn" ? "bg-warn/10" : "bg-bad/10";
  const firm = e.owner === "firm";

  return (
    <Overlay>
      <ScrollView contentContainerClassName="p-6">
        <View className={`rounded-2xl p-4 items-center ${bg}`}>
          <Text className="text-xs font-bold text-ink-mute">{tone === "good" ? "DOBRA WIADOMOŚĆ" : "NIESPODZIANKA"}</Text>
          <Animated.Text entering={BounceIn} className="text-6xl my-2">
            {e.icon}
          </Animated.Text>
          <Text className="text-xl font-extrabold text-ink text-center">{e.title}</Text>
        </View>
        <Text className="text-ink mt-4 leading-5">{eventText(game, ev.id)}</Text>

        {e.kind === "cost" ? (
          <View className="mt-4">
            {ev.covered > 0 ? (
              <Text className="text-good font-bold mb-2">
                🛡️ Ubezpieczenie pokrywa {fmt(ev.covered)}. Płacisz tylko udział własny: {fmt(ev.toPay)}.
              </Text>
            ) : e.insurance ? (
              <Text className="text-bad font-bold mb-2">Nie masz ubezpieczenia, które by to pokryło. Do zapłaty: {fmt(ev.toPay)}.</Text>
            ) : (
              <Text className="font-bold text-ink mb-2">Do zapłaty: {fmt(ev.toPay)}</Text>
            )}
            {ev.toPay > 0 ? (
              <>
                <Text className="text-ink-soft text-sm mb-2">Skąd weźmiesz pieniądze?</Text>
                {firm ? (
                  <>
                    <Choice selected={false} icon="🏪" label="Z konta firmy" hint={`Masz ${fmt(game.firm.cash)}`} onPress={() => pick({ kind: "cost", source: "firm" })} />
                    {game.firm.reserve > 0 ? (
                      <Choice selected={false} icon="🧱" label="Z rezerwy firmy" hint={`Masz ${fmt(game.firm.reserve)}`} onPress={() => pick({ kind: "cost", source: "reserve" })} />
                    ) : null}
                  </>
                ) : (
                  <>
                    <Choice selected={false} icon="🙂" label="Z mojego konta" hint={`Masz ${fmt(game.me.cash)}`} onPress={() => pick({ kind: "cost", source: "me" })} />
                    {game.me.savings > 0 ? (
                      <Choice selected={false} icon="🐷" label="Z poduszki finansowej" hint={`Masz ${fmt(game.me.savings)}`} onPress={() => pick({ kind: "cost", source: "savings" })} />
                    ) : null}
                    <Choice selected={false} icon="🏪" label="Wypłacę pieniądze z firmy" hint={`Konto firmy: ${fmt(game.firm.cash)} – firma też musi zapłacić rachunki`} onPress={() => pick({ kind: "cost", source: "firm" })} />
                  </>
                )}
                <Choice selected={false} icon="⚡" label={firm ? "Pożyczka pozabankowa" : "Chwilówka"} hint="Szybko, ale ok. 60% rocznie" onPress={() => pick({ kind: "cost", source: "loan" })} />
                <Choice selected={false} icon="⏳" label="Nie płacę teraz" hint="Powstanie zaległość z karą 10%/mies." onPress={() => pick({ kind: "cost", source: "defer" })} />
                <Text className="text-ink-mute text-xs mt-1">💡 Chwilówka i zaległość rozwiązują problem dziś, ale kosztują Cię w kolejnych miesiącach.</Text>
              </>
            ) : (
              <Button title="Super, dalej" onPress={() => pick({ kind: "cost", source: "me" })} />
            )}
          </View>
        ) : null}

        {e.kind === "info" ? (
          <View className="mt-4">
            {e.lesson ? <Text className="text-ink-soft text-sm mb-3">💡 {e.lesson}</Text> : null}
            <Button title="OK" onPress={() => pick({ kind: "info" })} />
          </View>
        ) : null}

        {e.kind === "inherit" ? (
          <View className="mt-4">
            <Choice selected={false} icon="💳" label="Spłacę najdroższe długi" hint="Reszta do poduszki" onPress={() => pick({ kind: "inherit", choice: "debt" })} />
            <Choice selected={false} icon="🐷" label="Wpłacę do poduszki" onPress={() => pick({ kind: "inherit", choice: "savings" })} />
            <Choice selected={false} icon="🧱" label="Zasilę rezerwę firmy" onPress={() => pick({ kind: "inherit", choice: "firm" })} />
            <Choice selected={false} icon="🏖️" label="Wakacje i nowy telefon!" onPress={() => pick({ kind: "inherit", choice: "spend" })} />
          </View>
        ) : null}

        {e.kind === "market" ? (
          <View className="mt-4">
            <Choice selected={false} icon="🧘" label="Trzymam – inwestuję na lata" onPress={() => pick({ kind: "market", choice: "hold" })} />
            <Choice selected={false} icon="🛒" label={`Dokupię za ${fmt(e.buyAmount ?? 2000)}`} hint="Taniej niż wczoraj" onPress={() => pick({ kind: "market", choice: "buy" })} />
            <Choice selected={false} icon="😱" label="Sprzedaję wszystko!" onPress={() => pick({ kind: "market", choice: "sell" })} />
          </View>
        ) : null}

        {error ? <Text className="text-bad font-semibold mt-2">{error}</Text> : null}
      </ScrollView>
    </Overlay>
  );
}

/** Po zamknięciu miesiąca: lekcja (sukces) albo wyjaśnienie, co poszło nie tak (porażka). */
export function ResultModal({ game }: { game: GameState }) {
  const { retry, next } = useGame();
  const r = game.result!;
  const lv = currentLevel(game);
  const [showLesson, setShowLesson] = useState(false);

  if (!r.pass) {
    const fails = r.goals.filter((g) => !g.ok);
    return (
      <Overlay>
        <ScrollView contentContainerClassName="p-6">
          <Animated.Text entering={BounceIn} className="text-6xl text-center">
            😬
          </Animated.Text>
          <Text className="text-2xl font-extrabold text-ink text-center mt-2">Prawie! Ten miesiąc trzeba powtórzyć</Text>
          <Text className="text-ink-soft text-center mt-1 mb-4">Co poszło nie tak i jak to naprawić:</Text>
          {fails.map((g, i) => (
            <Animated.View key={g.id} entering={FadeInDown.delay(120 * i)} className="bg-white rounded-2xl p-4 mb-3 border border-bad/20">
              <Text className="font-extrabold text-bad">✗ {g.label}</Text>
              <Text className="text-ink mt-1">{g.why}</Text>
              <Text className="text-ink-soft text-sm mt-2">
                <Text className="font-bold text-ink">Jak naprawić: </Text>
                {g.fix}
              </Text>
            </Animated.View>
          ))}
          {r.goals
            .filter((g) => g.ok)
            .map((g) => (
              <Text key={g.id} className="text-good text-sm">
                ✓ {g.label}
              </Text>
            ))}
          <Button className="mt-5" title="Spróbuj jeszcze raz 🔁" onPress={retry} />
        </ScrollView>
      </Overlay>
    );
  }

  if (!showLesson) {
    return (
      <Overlay>
        <ScrollView contentContainerClassName="p-6 items-center">
          <Animated.Text entering={BounceIn} className="text-7xl">
            🏆
          </Animated.Text>
          <Text className="text-2xl font-extrabold text-ink text-center mt-2">Misja wykonana!</Text>
          <Text className="text-ink-soft text-center mt-1">{lv.title}</Text>
          <Animated.View entering={FadeInDown.delay(200)} className="bg-gold/20 rounded-full px-4 py-2 mt-4">
            <Text className="font-extrabold text-ink">+{r.xp} XP</Text>
          </Animated.View>
          <View className="w-full mt-4 gap-1">
            <Text className="text-ink-soft text-sm">🏪 Firma: przychód {fmt(r.firmIn)}, koszty {fmt(r.firmOut)}</Text>
            <Text className="text-ink-soft text-sm">🙂 Ty: pensja {fmt(r.meIn)}, wydatki {fmt(r.meOut)}</Text>
          </View>
          {game.month.flags.badges.length ? (
            <View className="w-full mt-4">
              <Text className="font-bold text-ink mb-1">Odznaki:</Text>
              {game.month.flags.badges.map((b) => (
                <Text key={b} className="text-ink">
                  🏅 {b}
                </Text>
              ))}
            </View>
          ) : null}
          <Button className="mt-6 self-stretch" title="Czego się nauczyłem? 📚" onPress={() => setShowLesson(true)} />
        </ScrollView>
      </Overlay>
    );
  }

  const L = lv.lesson;
  return (
    <Overlay>
      <ScrollView contentContainerClassName="p-6">
        <Text className="text-xs font-bold text-ink-mute">LEKCJA · LEVEL {lv.n}</Text>
        <Animated.View entering={BounceIn} className="bg-brand-light rounded-3xl items-center py-6 my-3">
          <Text className="text-7xl">{L.art}</Text>
        </Animated.View>
        <Text className="text-2xl font-extrabold text-ink">{L.title}</Text>
        {L.points.map((p, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(150 * i)} className="flex-row gap-2 mt-3">
            <Text className="text-brand font-extrabold">{i + 1}.</Text>
            <Rich text={p} className="flex-1 leading-5" />
          </Animated.View>
        ))}
        <Animated.View entering={FadeInDown.delay(150 * L.points.length)} className="bg-ink rounded-2xl p-4 mt-5">
          <Text className="text-white font-bold">💡 {L.takeaway}</Text>
        </Animated.View>
        <Button
          className="mt-5"
          title={game.level >= totalLevels() ? "Zobacz podsumowanie 🎉" : `Udało się – miesiąc ${game.level + 1} ➜`}
          onPress={next}
        />
      </ScrollView>
    </Overlay>
  );
}
