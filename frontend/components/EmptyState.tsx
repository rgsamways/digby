import { Gem } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-stone-200">
        {icon ?? <Gem className="h-12 w-12" />}
      </div>
      <p className="font-display text-xl text-stone-700">{title}</p>
      {body && <p className="mt-2 max-w-xs text-sm text-stone-400">{body}</p>}
      {action && (
        <a href={action.href} className="btn-primary mt-6 text-sm">
          {action.label}
        </a>
      )}
    </div>
  );
}
