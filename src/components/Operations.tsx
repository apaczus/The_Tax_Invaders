import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import {
  ECON,
  INSURANCES,
  LIFESTYLE_LABEL,
  OPERATIONS,
  availableOperations,
  expensiveDebts,
  fmt,
  industryOf,
  yearly,
  type GameState,
  type Lifestyle,
  type OperationDef,
  type OperationId,
  type OperationInput,
} from "../engine";
import { useGame } from "../store/gameStore";
import { Button, Choice } from "./ui";

/** Lista operacji – boczny panel (tablet/web) albo zawartość dolnego menu (telefon). */
export function OperationsList({ game, onPick }: { game: GameState; onPick: (id: OperationId) => void }) {
  const avail = availableOperations(game);
  const locked = OPERATIONS.filter((o) => o.unlockLevel > game.level);
  return (
    <View>
      {avail.map((o) => (
        <OpRow key={o.id} op={o} onPress={() => onPick(o.id)} />
      ))}
      {locked.length ? (
        <Text className="text-[11px] font-bold text-ink-mute uppercase tracking-wider mt-4 mb-1 px-2">Odblokujesz później</Text>
      ) : null}
      {locked.map((o) => (
        <OpRow key={o.id} op={o} locked />
      ))}
    </View>
  );
}

function OpRow({ op, onPress, locked }: { op: OperationDef; onPress?: () => void; locked?: boolean }) {
  return (
    <Pressable
      disabled={locked}
      onPress={onPress}
      className={`flex-row items-center gap-3 px-2 py-2.5 rounded-xl ${locked ? "opacity-40" : "active:bg-brand-light"}`}
    >
      <Text className="text-2xl w-8 text-center">{locked ? "🔒" : op.icon}</Text>
      <View className="flex-1">
        <Text className="font-semibold text-ink">{op.name}</Text>
        <Text className="text-xs text-ink-mute">{locked ? `Level ${op.unlockLevel}` : op.sub}</Text>
      </View>
    </Pressable>
  );
}

function AmountInput({ value, onChange, quick }: { value: string; onChange: (v: string) => void; quick?: number[] }) {
  return (
    <View className="mb-3">
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^\d]/g, ""))}
        keyboardType="number-pad"
        placeholder="Kwota w zł"
        placeholderTextColor="#8A979E"
        className="bg-white border border-black/10 rounded-xl px-3 py-3 text-lg font-bold text-ink"
      />
      {quick?.length ? (
        <View className="flex-row flex-wrap gap-2 mt-2">
          {quick
            .filter((q) => q > 0)
            .map((q) => (
              <Pressable key={q} onPress={() => onChange(String(Math.floor(q)))} className="bg-brand-light rounded-full px-3 py-1">
                <Text className="text-brand-dark text-xs font-bold">{fmt(q)}</Text>
              </Pressable>
            ))}
        </View>
      ) : null}
    </View>
  );
}

function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <View className="flex-row bg-black/5 rounded-xl p-1 mb-3">
      {options.map(([v, l]) => (
        <Pressable key={v} onPress={() => onChange(v)} className={`flex-1 py-2 rounded-lg items-center ${value === v ? "bg-white" : ""}`}>
          <Text className={`text-sm font-bold ${value === v ? "text-ink" : "text-ink-mute"}`}>{l}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const Hint = ({ children }: { children: string }) => <Text className="text-ink-soft text-sm mb-3 leading-5">{children}</Text>;

/** Formularz jednej operacji. */
export function OperationForm({ game, id, onDone }: { game: GameState; id: OperationId; onDone: () => void }) {
  const operate = useGame((s) => s.operate);
  const def = OPERATIONS.find((o) => o.id === id)!;
  const I = industryOf(game.profile.industry);
  const [error, setError] = useState<string>();
  const [amount, setAmount] = useState("");
  const [dir, setDir] = useState<string>(id === "transfer" ? "firmToMe" : id === "invest" ? "buy" : "in");
  const [target, setTarget] = useState<string>(() => {
    const first = game.overdue[0] ? `overdue:${game.overdue[0].id}` : game.debts[0] ? `debt:${game.debts[0].id}` : "";
    return first;
  });
  const [lifestyle, setLifestyle] = useState<Lifestyle>(game.me.lifestyle);
  const [payment, setPayment] = useState<"cash" | "lease">("lease");
  const [product, setProduct] = useState<"bonds" | "etf">("bonds");
  const [ins, setIns] = useState<string[]>(Object.keys(game.insurance).filter((k) => game.insurance[k]));

  const submit = (input: OperationInput) => {
    const e = operate(input);
    if (e) setError(e);
    else onDone();
  };
  const n = Number(amount) || 0;

  let body: React.ReactNode = null;
  let action: (() => void) | null = null;
  let actionLabel = "Zatwierdź";

  switch (id) {
    case "pay": {
      const [t, tid] = target.split(":");
      const obj = t === "overdue" ? game.overdue.find((o) => o.id === tid) : game.debts.find((d) => d.id === tid);
      const owed = obj ? ("amount" in obj ? obj.amount : obj.balance) : 0;
      const acc = obj?.owner === "firm" ? game.firm.cash : game.me.cash;
      body = (
        <>
          <Hint>Zaległości firmowe i kredyt firmowy płacisz z konta firmy, prywatne – ze swojego. Zacznij od najdroższych.</Hint>
          {game.overdue.map((o) => (
            <Choice key={o.id} selected={target === `overdue:${o.id}`} icon="🔴" label={o.name} hint={`Zaległość · ${o.owner === "firm" ? "firma" : "Ty"} · ${fmt(o.amount)}`} onPress={() => setTarget(`overdue:${o.id}`)} />
          ))}
          {game.debts.map((d) => (
            <Choice key={d.id} selected={target === `debt:${d.id}`} icon={d.kind === "expensive" ? "🔥" : "🏦"} label={d.name} hint={`${yearly(d.rate)} rocznie · ${d.owner === "firm" ? "firma" : "Ty"} · ${fmt(d.balance)}`} onPress={() => setTarget(`debt:${d.id}`)} />
          ))}
          {obj ? (
            <>
              <Text className="text-xs text-ink-mute mb-1">
                Płacisz z: {obj.owner === "firm" ? "konta firmy" : "Twojego konta"} ({fmt(acc)}). Puste pole = całość.
              </Text>
              <AmountInput value={amount} onChange={setAmount} quick={[owed, Math.min(owed, acc)]} />
            </>
          ) : (
            <Hint>Nie masz nic do spłaty 🎉</Hint>
          )}
        </>
      );
      if (obj) action = () => submit({ op: "pay", target: { type: t as "debt" | "overdue", id: tid }, amount: n || undefined });
      actionLabel = "Spłać";
      break;
    }
    case "transfer":
      body = (
        <>
          <Seg value={dir} onChange={setDir} options={[["firmToMe", "Firma → Ty"], ["meToFirm", "Ty → Firma"]]} />
          <Hint>{`Konto firmy: ${fmt(game.firm.cash)} · Twoje konto: ${fmt(game.me.cash)}. Pamiętaj, że firma musi jeszcze zapłacić swoje rachunki.`}</Hint>
          <AmountInput value={amount} onChange={setAmount} quick={[1000, 2000, 5000]} />
        </>
      );
      action = () => submit({ op: "transfer", direction: dir as "firmToMe" | "meToFirm", amount: n });
      actionLabel = "Przelej";
      break;
    case "budget":
      body = (
        <>
          <Hint>Ile wydajesz miesięcznie na życie. Oszczędny budżet to szybki sposób na wolną gotówkę.</Hint>
          {(Object.keys(ECON.personal.lifestyle) as Lifestyle[]).map((k) => (
            <Choice key={k} selected={lifestyle === k} label={LIFESTYLE_LABEL[k]} hint={`${fmt(ECON.personal.lifestyle[k])} / mies.`} onPress={() => setLifestyle(k)} />
          ))}
        </>
      );
      action = () => submit({ op: "budget", lifestyle });
      break;
    case "sell":
      body = <Hint>{`Rower, którego nie używasz, stara konsola, ubrania… Jednorazowo +${fmt(ECON.personal.sellStuffAmount)} na Twoje konto.`}</Hint>;
      action = game.me.soldStuff ? null : () => submit({ op: "sell" });
      actionLabel = game.me.soldStuff ? "Już sprzedane" : "Sprzedaj";
      break;
    case "consolidate": {
      const e = expensiveDebts(game);
      const tot = e.reduce((a, d) => a + d.balance, 0);
      body = (
        <Hint>
          {e.length
            ? `Bank spłaci Twoje drogie długi (${e.map((d) => d.name).join(", ")} – razem ${fmt(tot)}) i zastąpi je jednym kredytem na ${yearly(ECON.consolidationMonthlyRate)} rocznie, z ratą ok. ${fmt(Math.ceil((tot * ECON.consolidationPaymentShare) / 10) * 10)}/mies.`
            : "Nie masz drogich długów – nie ma czego konsolidować."}
        </Hint>
      );
      action = e.length ? () => submit({ op: "consolidate" }) : null;
      actionLabel = "Weź kredyt konsolidacyjny";
      break;
    }
    case "separate":
      body = <Hint>Osobne konto firmowe = czysta księgowość, niższa faktura od księgowej i bank, który widzi prawdziwy zysk firmy.</Hint>;
      action = () => submit({ op: "separate" });
      actionLabel = "Załóż konto firmowe";
      break;
    case "savings":
    case "reserve": {
      const isMe = id === "savings";
      const bal = isMe ? game.me.savings : game.firm.reserve;
      body = (
        <>
          <Seg value={dir} onChange={setDir} options={[["in", "Wpłać"], ["out", "Wypłać"]]} />
          <Hint>{`${isMe ? "Poduszka" : "Rezerwa"}: ${fmt(bal)} · ${isMe ? "Twoje konto" : "Konto firmy"}: ${fmt(isMe ? game.me.cash : game.firm.cash)}`}</Hint>
          <AmountInput value={amount} onChange={setAmount} quick={[1000, 2000, 4000]} />
        </>
      );
      action = () => submit({ op: id, direction: dir as "in" | "out", amount: n });
      break;
    }
    case "salary":
      body = (
        <>
          <Hint>{`Teraz: ${fmt(game.me.salary)}. Nowa pensja zacznie obowiązywać od przyszłego miesiąca (${fmt(ECON.personal.salaryMin)}–${fmt(ECON.personal.salaryMax)}).`}</Hint>
          <AmountInput value={amount} onChange={setAmount} quick={[6000, 7000, 8000]} />
        </>
      );
      action = () => submit({ op: "salary", amount: n });
      break;
    case "hire":
      body = (
        <Hint>
          {`${I.role}: rekrutacja ${fmt(ECON.firm.hireCost)} teraz, pensja ${fmt(ECON.firm.staffCost)}/mies. od tego miesiąca, dodatkowy przychód +${fmt(ECON.firm.staffRevenue)}/mies. od następnego. Zespół: ${game.firm.staff}/${ECON.firm.maxStaff}.`}
        </Hint>
      );
      action = () => submit({ op: "hire" });
      actionLabel = "Zatrudnij";
      break;
    case "equip":
      body = (
        <>
          <Hint>{`${I.equip}: +${fmt(ECON.firm.equipRevenue)} przychodu/mies. od następnego miesiąca.`}</Hint>
          <Choice selected={payment === "lease"} icon="📄" label="Leasing" hint={`${fmt(ECON.firm.leaseRate)}/mies. przez ${ECON.firm.leaseMonths} mies. · chroni płynność`} onPress={() => setPayment("lease")} />
          <Choice selected={payment === "cash"} icon="💵" label="Gotówka" hint={`${fmt(ECON.firm.equipCost)} od razu · taniej w sumie`} onPress={() => setPayment("cash")} />
        </>
      );
      action = game.firm.equip ? null : () => submit({ op: "equip", payment });
      actionLabel = game.firm.equip ? "Sprzęt już masz" : "Kup";
      break;
    case "marketing":
      body = <Hint>{`${I.marketing}: koszt ${fmt(ECON.firm.marketingCost)} teraz, +${fmt(ECON.firm.marketingRevenue)} przychodu w przyszłym miesiącu (jednorazowo).`}</Hint>;
      action = () => submit({ op: "marketing" });
      actionLabel = "Uruchom kampanię";
      break;
    case "insurance":
      body = (
        <>
          <Hint>Zaznacz ubezpieczenia, które chcesz mieć. Składki płacisz co miesiąc.</Hint>
          {Object.entries(INSURANCES)
            .filter(([k]) => k !== "oc_auto" && !(k === "ac" && game.profile.car !== "private"))
            .map(([k, v]) => (
              <Choice
                key={k}
                selected={ins.includes(k)}
                icon={v.icon}
                label={`${v.name} · ${fmt(v.cost)}/mies.`}
                hint={v.desc}
                onPress={() => setIns(ins.includes(k) ? ins.filter((x) => x !== k) : [...ins, k])}
              />
            ))}
        </>
      );
      action = () => submit({ op: "insurance", selected: ins });
      break;
    case "invest":
      body = (
        <>
          <Seg value={product} onChange={setProduct} options={[["bonds", "Obligacje"], ["etf", "Fundusz ETF"]]} />
          <Seg value={dir} onChange={setDir} options={[["buy", "Kup"], ["sell", "Sprzedaj"]]} />
          <Hint>
            {product === "bonds"
              ? `Obligacje skarbowe: ok. ${yearly(ECON.bondsMonthlyRate)} rocznie, stabilnie. Masz: ${fmt(game.investments.bonds)}.`
              : `ETF na szeroki rynek: średnio więcej, ale wartość się waha. Masz: ${fmt(game.investments.etf)}.`}
          </Hint>
          <AmountInput value={amount} onChange={setAmount} quick={[1000, 2000, 3000]} />
        </>
      );
      action = () => submit({ op: "invest", product, direction: dir as "buy" | "sell", amount: n });
      break;
  }

  return (
    <View className="p-5">
      <View className="flex-row items-center gap-3 mb-4">
        <Text className="text-3xl">{def.icon}</Text>
        <Text className="text-xl font-extrabold text-ink flex-1">{def.name}</Text>
        <Pressable onPress={onDone} hitSlop={12}>
          <Text className="text-2xl text-ink-mute">✕</Text>
        </Pressable>
      </View>
      <ScrollView style={{ maxHeight: 420 }}>{body}</ScrollView>
      {error ? <Text className="text-bad font-semibold my-2">{error}</Text> : null}
      <View className="flex-row gap-3 mt-3">
        <Button title="Anuluj" variant="ghost" onPress={onDone} />
        <Button className="flex-1" title={actionLabel} disabled={!action} onPress={() => action?.()} />
      </View>
    </View>
  );
}
