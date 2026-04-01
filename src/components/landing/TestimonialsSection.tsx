"use client";

import React from "react";
import { Quote } from "lucide-react";

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "SaaS Founder",
      content: "Shipgrid matched me with three tools that saved me $500/month and solved my database scaling issues in one afternoon.",
      avatar: "SC",
      color: "bg-indigo-500",
    },
    {
      name: "Alex Rivera",
      role: "Lead Designer",
      content: "Finally, a discovery platform that understands my budget and the specific UI challenges I face as a growing team.",
      avatar: "AR",
      color: "bg-purple-500",
    },
    {
      name: "Jason Miller",
      role: "Indie Hacker",
      content: "The AI matching score is remarkably accurate. It's like having a product scout who knows exactly what I need.",
      avatar: "JM",
      color: "bg-pink-500",
    },
  ];

  return (
    <section className="py-24 overflow-hidden">
      <div className="container px-4 mx-auto text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 title-font text-foreground">
          Trusted by <span className="text-primary italic">Builders</span> Everywhere
        </h2>
        <p className="text-muted-foreground font-medium text-lg leading-relaxed">
          From solo hackers to lead founders, the community relies on our matching engine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        {testimonials.map((t, i) => (
          <div key={i} className="p-8 rounded-[32px] bg-muted/30 border border-border/50 relative">
            <Quote className="absolute top-6 right-8 text-primary/10 w-12 h-12" />
            <p className="text-lg font-medium text-foreground mb-8 relative z-10 italic">
              "{t.content}"
            </p>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                {t.avatar}
              </div>
              <div className="text-left">
                <h4 className="font-bold text-foreground">{t.name}</h4>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
