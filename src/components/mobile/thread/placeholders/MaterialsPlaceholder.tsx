export function MaterialsPlaceholder() {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-8 h-8 rounded-full border border-neutral-300 bg-transparent"
        />
      ))}
    </div>
  );
}
