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
    <div className="flex items-center justify-between rounded-md border px-5 py-4">
      <span className="text-sm font-medium text-muted-foreground">Estimated total</span>
      <span className="text-2xl font-semibold" style={{ color: "#647d75" }}>
        {eur.format(total)}
      </span>
    </div>
  );
}
