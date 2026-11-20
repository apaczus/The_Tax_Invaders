export const fmt = (n: number): string =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    .replace(/^-/, "−") + " zł";

export const fmtSigned = (n: number): string => (n >= 0 ? "+" : "−") + fmt(Math.abs(n));

/** oprocentowanie miesięczne -> roczne w % */
export const yearly = (monthlyRate: number): string =>
  `${(Math.round(monthlyRate * 12 * 1000) / 10).toString().replace(".", ",")}%`;
