export function RoadmapPlaceholder() {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="w-6 h-1.5 rounded-full bg-neutral-200"
        />
      ))}
    </div>
  );
}
