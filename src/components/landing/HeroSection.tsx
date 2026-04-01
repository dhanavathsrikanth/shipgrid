"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, ShieldCheck, Globe } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative pt-20 pb-24 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container relative z-10 px-4 mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI-Powered Matching Engine for Builders</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 title-font text-foreground">
          Ship Faster. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
            Match Smarter.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 font-medium leading-relaxed">
          The curated discovery engine for products that fit your professional role, solve your challenges, and match your budget.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button size="lg" className="h-12 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-base font-bold shadow-xl shadow-primary/20 group" asChild>
            <Link href="/personalize">
              Boost My Feed <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8 rounded-xl border-border bg-background/50 backdrop-blur-sm hover:bg-muted text-base font-bold" asChild>
            <Link href="/submit">Submit Product</Link>
          </Button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-border/50">
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">High Speed Discovery</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Verified Submissions</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Score Matching</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Global Reach</span>
          </div>
        </div>
      </div>
    </section>
  );
}
