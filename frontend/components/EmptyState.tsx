interface EmptyStateProps {
  icon?: string;
  title: string;
  body?: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon = "🪨", title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="mb-4 text-5xl opacity-25">{icon}</span>
      <p className="font-display text-xl text-stone-700">{title}</p>
      {body && <p className="mt-2 max-w-xs text-sm text-stone-400">{body}</p>}
      {action && (
        <a
          href={action.href}
          className="btn-primary mt-6 text-sm"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}
