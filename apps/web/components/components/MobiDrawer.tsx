"use client"

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

export type Props = {
  title?: string;
  open: boolean;
  onOpenChange?(open: boolean): void
  children: React.ReactNode;
  variant?: "left" | "right";
};

const MobiDrawer: React.FC<Props> = ({
  title,
  open,
  onOpenChange,
  children,
  variant = "left",
}) => {
  const asideClasses = variant === "left"
    ? "left-[220px] border-r" : "right-0 border-l";

  const dialogClasses = variant === "left"
    ? "translate-x-[-100%]" : "translate-x-[100%]";

 	return (
     <>
        <div className="flex items-center gap-2 md:hidden">
          <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Trigger asChild>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 md:hidden" />
              <Dialog.Content className={`fixed inset-y-0 ${variant}-0 z-50 w-80 ${dialogClasses} bg-card p-4 shadow-lg outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-${variant} data-[state=closed]:animate-out data-[state=closed]:slide-out-to-${variant} data-[state=open]:translate-x-0 md:hidden`}>
                <div className="flex items-center justify-between pb-2">
                  <Dialog.Title className="text-base font-semibold">{ title }</Dialog.Title>
                  <Dialog.Close asChild>
                    <button aria-label="Close" className="rounded-md p-2 hover:bg-accent">
                      <X className="h-5 w-5" />
                    </button>
                  </Dialog.Close>
                </div>
                <div className="space-y-4">
                  { children }
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        <div className="hidden md:block">
          <aside className={`fixed ${asideClasses} top-14 bottom-0 z-30 w-80 bg-card p-4 shadow-sm`}>
            <div className="pb-2">
              <div className="text-base font-semibold">{ title }</div>
            </div>
            <div className="space-y-4">
              <div className="grid gap-2">
                { children }
              </div>
            </div>
          </aside>
        </div>
     </>
  );
}

export default MobiDrawer;
