"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Github, Twitter, Mail, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function Footer() {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const subscribe = useMutation(api.newsletter.subscribe);
  const settings = useQuery(api.settings.get);

  const siteTitle = settings?.siteTitle || "ShipGrid";

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    try {
      const result = await subscribe({ email });
      if (result.success) {
        toast.success(result.message);
        setEmail("");
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to subscribe.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-background border-t border-border pt-16 pb-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-16">
          <div className="space-y-4">
            <Link href="/" className="inline-block text-xl font-bold text-foreground hover:opacity-80 transition-opacity">
              {siteTitle}
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The ultimate grid for discovering, sharing, and vibing on the best indie apps. Join our community of builders.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="https://github.com/dhanavathsrikanth/shipgrid" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Platform</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/explore" className="text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground transition-colors">Leaderboard</Link>
              </li>
              <li>
                <Link href="/submit" className="text-muted-foreground hover:text-foreground transition-colors font-medium text-primary">Submit App</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/personalize" className="text-muted-foreground hover:text-foreground transition-colors">Personalize</Link>
              </li>
              <li>
                <Link href="/notifications" className="text-muted-foreground hover:text-foreground transition-colors">Notifications</Link>
              </li>
              <li>
                <Link href="/inbox" className="text-muted-foreground hover:text-foreground transition-colors">Inbox</Link>
              </li>
              <li>
                <button onClick={() => setShowAboutModal(true)} className="text-muted-foreground hover:text-foreground transition-colors text-left">About the Project</button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">Cookie Policy</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="bg-muted p-6 rounded-2xl border border-border">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Stay updated
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Get the weekly digest of the best apps submitted to the community.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Subscribe <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} {siteTitle}. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Made with</span>
            <span className="text-red-500 inline-flex">❤️</span>
            <span>for the builder community.</span>
          </div>
        </div>
      </div>

      <Dialog.Root open={showAboutModal} onOpenChange={setShowAboutModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card p-8 rounded-3xl shadow-2xl w-[90vw] max-w-lg z-[70] border border-border">
            <div className="flex justify-between items-start mb-6">
              <div>
                <Dialog.Title className="text-2xl font-bold text-foreground mb-1">
                  About Shipgrid
                </Dialog.Title>
                <div className="h-1 w-12 bg-primary rounded-full"></div>
              </div>
              <Dialog.Close className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
            <div className="prose prose-sm text-muted-foreground space-y-4">
              <p className="text-base">
                Welcome to <span className="font-semibold text-foreground">Shipgrid</span>, the definitive community platform for builders to showcase their apps, discover builders, and define their audience.
              </p>
              
              <p>
                Powered by <a href="https://convex.dev?utm_source=goshipgrid-app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Convex</a>, this platform delivers real-time updates and seamless state management.
              </p>
              
              <div className="bg-muted p-4 rounded-2xl border border-border space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Core Features</p>
                <ul className="grid grid-cols-2 gap-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> App Submissions</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Real-time Vibing</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Leaderboard</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Open Source</li>
                </ul>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <p className="text-sm">Built for the community of indie builders.</p>
                <div className="flex gap-4">
                  <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} Shipgrid</span>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </footer>
  );
}


