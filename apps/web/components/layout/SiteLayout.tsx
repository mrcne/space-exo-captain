"use client";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SiteLayout = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const NavLink = ({ href, label }: { href: string; label: string; }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
      >
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-14 items-center gap-3 px-4">
          <div className="md:hidden">
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild>
                <button
                  aria-label="Open menu"
                  className="inline-flex items-center justify-center rounded-md border bg-card px-2 py-2 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
                <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-72 translate-x-[-100%] bg-sidebar p-4 shadow-lg outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:translate-x-0">
                  <div className="flex items-center justify-between pb-2">
                    <Brand />
                    <Dialog.Close asChild>
                      <button aria-label="Close menu" className="rounded-md p-2 hover:bg-accent">
                        <X className="h-5 w-5" />
                      </button>
                    </Dialog.Close>
                  </div>
                  <nav className="mt-2 grid gap-1">
                    <NavLink href="/" label="Home" />
                    <NavLink href="/explore" label="Explore" />
                    <NavLink href="/investigate" label="Investigate" />
                  </nav>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>

          <div className="flex flex-1 items-center gap-3 md:flex-none">
            <Brand />
          </div>

          <div className="ml-auto" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside className="sticky top-14 hidden h-[calc(100dvh-56px)] border-r bg-sidebar p-4 md:block">
          <nav className="grid gap-1">
            <NavLink href="/" label="Home" />
            <NavLink href="/explore" label="Explore" />
            <NavLink href="/investigate" label="Investigate" />
          </nav>
        </aside>

        <main className="min-h-[calc(100dvh-56px)] p-4">{children}</main>
      </div>
    </div>
  );
}

const Brand = () => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold">Captain Exoplanet</span>
    </div>
  );
}
export default SiteLayout;
