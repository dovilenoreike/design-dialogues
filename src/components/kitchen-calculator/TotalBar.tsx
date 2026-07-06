interface TotalBarProps {
  total: number;
}

const eur = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Single estimated total (spec §Summary Display — V1: total only). */
export function TotalBar({ total }: TotalBarProps) {
  return (
    <div
      className="flex items-center justify-between rounded-lg border px-5 py-4"
      style={{ borderColor: "#647d75", backgroundColor: "rgba(100,125,117,0.06)" }}
    >
      <span className="text-sm font-medium text-muted-foreground">Estimated total</span>
      <span className="font-serif text-3xl" style={{ color: "#647d75" }}>
        {eur.format(total)}
      </span>
    </div>
  );
}
