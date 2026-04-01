"use client";

import React from "react";
import { Layers, Target, ShieldCheck, Zap, Users, BarChart3 } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      title: "Persona Matching",
      description: "Our AI engine analyzes your role, challenges, and budget to find products that actually move the needle for you.",
      icon: Target,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      title: "Verified Only",
      description: "Every submission is manually vetted by our team to ensure high quality and genuine utility for builders.",
      icon: ShieldCheck,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Real Performance",
      description: "Filter products by their current stage (Beta, Building, Live) and see real-time match scores for your ICP.",
      icon: BarChart3,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
    {
      title: "Expert Curation",
      description: "No noisy marketplaces. Just high-signal discoveries curated for the modern technology builder.",
      icon: Layers,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Global Reach",
      description: "Discover products from around the world, specifically filtered by your regional and budget constraints.",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Builder Community",
      description: "Join thousands of builders sharing insights, votes, and ratings on the latest shipping tools.",
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <section className="py-24 bg-muted/20 border-y border-border/50">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 title-font text-foreground">
            How Shipgrid <span className="text-primary italic">Differentiates</span> Results
          </h2>
          <p className="text-muted-foreground font-medium text-lg leading-relaxed">
            We don't just list products; we match them. Our platform ensures that every discovery is relevant to your specific journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group p-8 rounded-3xl bg-card border border-border/50 transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
              <div className={`p-4 rounded-2xl w-fit mb-6 transition-transform group-hover:scale-110 ${feature.bg} ${feature.color}`}>
                <feature.icon size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 title-font tracking-tight text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed leading-extra-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
