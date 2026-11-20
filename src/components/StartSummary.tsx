import { Text, View } from "react-native";
import { DEBTS, ECON, INSURANCES, fmt, industryOf, type Profile } from "../engine";
import { Card } from "./ui";

function Row({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-ink-soft">{label}</Text>
      <Text className={`font-bold ${bad ? "text-bad" : "text-ink"}`}>{value}</Text>
    </View>
  );
}

export function StartSummary({ profile: p }: { profile: Profile }) {
  const I = industryOf(p.industry);
  const debts = p.debts.filter((k) => DEBTS[k]).map((k) => DEBTS[k]);
  const cushion = (ECON.personal.cushionStart as Record<string, number>)[p.cushion] ?? 0;
  const ins = p.insurances.filter((k) => INSURANCES[k]).map((k) => INSURANCES[k].name);
  if (p.car === "private") ins.unshift("OC auta");
  const overdueFirm = ECON.startOverdue.reduce((a, o) => a + o.amount, 0);
  return (
    <View className="gap-3">
      <Card>
        <Text className="font-extrabold text-ink mb-1">
          {I.icon} {p.firmName || I.type}
        </Text>
        <Row label="Konto firmy" value={fmt(ECON.firm.startCash)} />
        <Row label="Przychód" value={`${fmt(ECON.firm.baseRevenue)}/mies.`} />
        <Row label="Zespół" value={`Ty + 1 (${I.role.toLowerCase()})`} />
        <Row label="Zaległości firmy" value={fmt(overdueFirm)} bad />
      </Card>
      <Card>
        <Text className="font-extrabold text-ink mb-1">🙂 {p.name || "Ty"}</Text>
        <Row label="Konto osobiste" value={fmt(ECON.personal.startCash)} />
        <Row label="Poduszka" value={fmt(cushion)} />
        <Row label="Pensja z firmy" value={`${fmt(ECON.personal.salary)}/mies.`} />
      </Card>
      <Card>
        <Text className="font-extrabold text-ink mb-1">💳 Długi</Text>
        {debts.length || p.housing === "mortgage" || p.debts.includes("rachunki") ? null : <Text className="text-ink-soft">Brak długów 🙌</Text>}
        {debts.map((d) => (
          <Row key={d.name} label={d.name} value={fmt(d.balance)} />
        ))}
        {p.housing === "mortgage" ? <Row label="Kredyt hipoteczny" value={fmt(ECON.mortgage.balance)} /> : null}
        {p.debts.includes("rachunki") ? <Row label="Zaległe rachunki" value={fmt(ECON.unpaidBillsOverdue.amount)} bad /> : null}
      </Card>
      <Card>
        <Text className="font-extrabold text-ink mb-1">🛡️ Ubezpieczenia</Text>
        {ins.length ? ins.map((n) => <Text key={n} className="text-ink py-0.5">✓ {n}</Text>) : <Text className="text-ink-soft">Brak ubezpieczeń</Text>}
      </Card>
      <View className="bg-brand-light rounded-2xl p-4">
        <Text className="text-brand-dark">
          5 leveli = 5 miesięcy: <Text className="font-bold">długi → poduszka → rozwój firmy → ubezpieczenia → inwestycje</Text>. Operacje
          znajdziesz w menu – z każdym levelem będzie ich więcej.
        </Text>
      </View>
    </View>
  );
}
