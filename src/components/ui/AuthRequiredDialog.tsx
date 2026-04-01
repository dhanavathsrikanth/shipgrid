"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, LogIn } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";

interface AuthRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: string; // e.g., "vote", "comment", "rate"
  title?: string;
  description?: string;
}

export function AuthRequiredDialog({
  isOpen,
  onClose,
  action,
  title,
  description,
}: AuthRequiredDialogProps) {
  const defaultTitle = `Sign in to ${action}`;
  const defaultDescription = `You need to be signed in to ${action} on apps. Join the community to participate!`;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card p-6 rounded-lg border border-border w-[90vw] max-w-md z-50 shadow-lg animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-start mb-4">
            <Dialog.Title className="text-lg font-medium text-foreground">
              {title || defaultTitle}
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground p-1 transition-colors" onClick={onClose}>
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="mb-6">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {description || defaultDescription}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <SignInButton mode="modal">
              <button
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90 transition-colors"
                type="button">
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            </SignInButton>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-muted-foreground hover:text-foreground rounded-md text-sm border border-border hover:border-muted-foreground/30 transition-all">
              Maybe Later
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


