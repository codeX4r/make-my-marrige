interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  illustration?: React.ReactNode;
}

export function EmptyState({ title, description, action, illustration }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      {illustration || (
        <svg
          className="w-16 h-16 text-muted mx-auto mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      <h2 className="text-xl font-semibold text-text mb-2">{title}</h2>
      <p className="text-muted mb-6 max-w-md">{description}</p>
      {action && (
        <a
          href={action.href}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary hover:text-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}

export default EmptyState;
