import type { ReactNode } from 'react';

interface PageShellProps {
  maxWidth?: string;
  children: ReactNode;
}

export default function PageShell({ maxWidth = 'max-w-7xl', children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className={`${maxWidth} mx-auto px-4`}>
        {children}
      </div>
    </div>
  );
}
