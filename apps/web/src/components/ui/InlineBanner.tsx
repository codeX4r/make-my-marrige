interface InlineBannerProps {
  type: "error" | "warning" | "info";
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

const typeStyles: Record<InlineBannerProps["type"], string> = {
  error: "bg-danger/10 border-danger text-danger",
  warning: "bg-warning/10 border-warning text-warning",
  info: "bg-info/10 border-info text-info",
};

function BannerIcon({ type }: { type: InlineBannerProps["type"] }) {
  const paths: Record<InlineBannerProps["type"], string> = {
    error:
      "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",
    warning:
      "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.527 0-2.49-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z",
    info: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z",
  };

  return (
    <svg
      className="h-5 w-5 flex-shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path fillRule="evenodd" d={paths[type]} clipRule="evenodd" />
    </svg>
  );
}

export function InlineBanner({ type, message, action, onDismiss }: InlineBannerProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${typeStyles[type]}`}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <BannerIcon type={type} />
      <p className="flex-1 text-sm">{message}</p>

      {action && (
        <button
          type="button"
          className="ml-2 px-3 py-1.5 text-sm font-medium text-primary hover:text-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}

      {onDismiss && (
        <button
          type="button"
          className="ml-1 rounded p-1 text-current opacity-75 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export default InlineBanner;
