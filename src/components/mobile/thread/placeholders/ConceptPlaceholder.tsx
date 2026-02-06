export function ConceptPlaceholder() {
  return (
    <div className="flex gap-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-12 h-12 rounded border border-dashed border-neutral-300 bg-transparent"
        />
      ))}
    </div>
  );
}
