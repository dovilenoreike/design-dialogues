/** Shared euro formatter for the kitchen calculator (whole euros, no cents). */
const eur = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const formatEur = (n: number): string => eur.format(n);
