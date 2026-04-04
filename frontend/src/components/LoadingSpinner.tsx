type SpinnerSize = 'sm' | 'md';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingSpinner({ size = 'md', fullScreen = false, className }: LoadingSpinnerProps) {
  const sizeClasses = size === 'sm'
    ? 'w-6 h-6 border-2'
    : 'w-8 h-8 border-4';

  const spinner = (
    <div className={`${sizeClasses} border-primary border-t-transparent rounded-full animate-spin`} />
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center${className ? ` ${className}` : ''}`}>
      {spinner}
    </div>
  );
}
