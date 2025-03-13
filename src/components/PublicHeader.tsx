import { ThemeToggle } from '@/components/ui/theme-toggle';

export function PublicHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b bg-background z-50">
      <div className="container mx-auto h-full flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold">Affiliate Tools</span>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
} 