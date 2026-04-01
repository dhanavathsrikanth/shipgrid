"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function CtaSection() {
  return (
    <section className="py-24 px-4 bg-muted/20 border-t border-border/50">
      <div className="max-w-4xl mx-auto rounded-[32px] md:rounded-[48px] bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 p-8 md:p-16 text-center relative overflow-hidden group">
        <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-primary/5 opacity-50 group-hover:scale-110 transition-transform" />
        
        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 title-font text-foreground italic">
            Ready to <span className="text-primary italic">Optimize</span> Your Discovery?
          </h2>
          <p className="text-muted-foreground font-medium text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Join 1,000+ builders who have personalized their Shipgrid feed to match their unique professional challenges.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-base font-bold shadow-xl shadow-foreground/5 transition-all active:scale-95 group" asChild>
              <Link href="/personalize">
                Get Personalize Now <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-10 rounded-xl border-border bg-background/50 backdrop-blur-sm hover:bg-muted text-base font-bold" asChild>
              <Link href="/submit">Start Shipping</Link>
            </Button>
          </div>
          
          <p className="mt-8 text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] animate-pulse">
            Free forever for early adopters
          </p>
        </div>
      </div>
    </section>
  );
}
