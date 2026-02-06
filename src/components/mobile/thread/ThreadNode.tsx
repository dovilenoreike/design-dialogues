interface ThreadNodeProps {
  completed: boolean;
  active?: boolean;
}

export function ThreadNode({ completed, active = false }: ThreadNodeProps) {
  // Completed: solid muted-foreground
  if (completed) {
    return (
      <div className="w-3 h-3 rounded-full bg-muted-foreground border-2 border-background flex-shrink-0" />
    );
  }

  // Active (first incomplete): larger with halo
  if (active) {
    return (
      <div className="w-3.5 h-3.5 rounded-full bg-foreground ring-4 ring-foreground/10 border-2 border-background flex-shrink-0" />
    );
  }

  // Pending: hollow
  return (
    <div className="w-3 h-3 rounded-full bg-background border-2 border-muted-foreground flex-shrink-0" />
  );
}
