import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { useSession } from '@/features/auth/api';
import { Button } from '@/shadcn/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shadcn/components/ui/sheet';
import { Toaster } from '@/shadcn/components/ui/sonner';

type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

const NAV_LINKS = [
  { to: '/engagements', label: 'Engagements' },
  { to: '/indicateurs', label: 'Indicateurs' },
  { to: '/nominations', label: 'Nominations' },
  { to: '/deliberations', label: 'Délibérations' },
  { to: '/about', label: 'À propos' },
] as const;

function RootComponent() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, isLoading } = useSession();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/70">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="group flex items-baseline gap-1.5 text-foreground transition-opacity hover:opacity-80"
            aria-label="Vigie Citoyenne — accueil"
          >
            <span className="text-base font-normal tracking-tight">vigie</span>
            <span
              aria-hidden="true"
              className="size-1.5 -translate-y-0.5 rounded-full bg-primary"
            />
            <span className="text-base font-medium tracking-tight">citoyenne</span>
            <span className="ml-1 hidden text-xs font-normal text-muted-foreground sm:inline">
              Poitiers
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden items-center gap-1 text-sm md:flex">
            {NAV_LINKS.map((link) => (
              <NavItem key={link.to} to={link.to}>
                {link.label}
              </NavItem>
            ))}
            {!isLoading &&
              (session ? (
                <NavItem to="/espace-contributeur">Espace contributeur</NavItem>
              ) : (
                <NavItem to="/login">Connexion</NavItem>
              ))}
          </ul>

          {/* Mobile nav trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="size-5" />
                </Button>
              }
            />
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="border-b border-border px-4 py-4">
                <SheetTitle className="text-left text-xs font-normal uppercase tracking-wider text-muted-foreground">
                  Navigation
                </SheetTitle>
              </SheetHeader>
              <ul className="flex flex-col gap-0.5 p-2">
                {NAV_LINKS.map((link) => (
                  <MobileNavItem key={link.to} to={link.to} onNavigate={() => setMobileOpen(false)}>
                    {link.label}
                  </MobileNavItem>
                ))}
                {!isLoading &&
                  (session ? (
                    <MobileNavItem
                      to="/espace-contributeur"
                      onNavigate={() => setMobileOpen(false)}
                    >
                      Espace contributeur
                    </MobileNavItem>
                  ) : (
                    <MobileNavItem to="/login" onNavigate={() => setMobileOpen(false)}>
                      Connexion
                    </MobileNavItem>
                  ))}
              </ul>
            </SheetContent>
          </Sheet>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <Footer />

      <Toaster position="top-center" duration={3000} />
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        to={to}
        className="relative inline-flex h-9 items-center rounded-md px-3 text-muted-foreground transition-colors hover:text-foreground"
        activeProps={{
          className: 'text-foreground font-medium',
        }}
        activeOptions={{ exact: false }}
      >
        {({ isActive }) => (
          <>
            {children}
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute inset-x-3 -bottom-3.25 h-0.5 bg-primary"
              />
            )}
          </>
        )}
      </Link>
    </li>
  );
}

function MobileNavItem({
  to,
  children,
  onNavigate,
}: {
  to: string;
  children: React.ReactNode;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        to={to}
        onClick={onNavigate}
        className="group flex items-center gap-3 rounded-md px-3 py-3 text-base text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        activeProps={{
          className: 'text-foreground font-medium bg-accent/50',
        }}
        activeOptions={{ exact: false }}
      >
        {({ isActive }) => (
          <>
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full transition-colors ${
                isActive ? 'bg-primary' : 'bg-transparent'
              }`}
            />
            <span>{children}</span>
          </>
        )}
      </Link>
    </li>
  );
}

function Footer() {
  return (
    <footer className="mt-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          vigie <span className="text-primary">•</span> citoyenne{' '}
          <span className="text-muted-foreground/70">· Poitiers</span>
        </p>
        <nav className="flex items-center gap-4 text-xs uppercase tracking-wider text-muted-foreground">
          <Link to="/mentions-legales" className="transition-colors hover:text-foreground">
            Mentions légales
          </Link>
        </nav>
      </div>
    </footer>
  );
}
