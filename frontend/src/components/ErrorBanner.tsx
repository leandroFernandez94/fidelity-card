interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  id?: string;
}

export default function ErrorBanner({ message, onDismiss, className, id }: ErrorBannerProps) {
  const baseClasses = `rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700${className ? ` ${className}` : ''}`;

  if (onDismiss) {
    return (
      <div id={id} className={baseClasses}>
        <div className="flex items-center justify-between">
          <span>{message}</span>
          <button
            type="button"
            onClick={onDismiss}
            className="ml-4 text-red-500 hover:text-red-700 font-medium"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id={id} className={baseClasses}>
      {message}
    </div>
  );
}
