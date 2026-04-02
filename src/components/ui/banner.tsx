"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface Banner1Props {
  title: string;
  description: string;
  linkText: string;
  linkUrl: string;
  defaultVisible?: boolean;
}

const Banner1 = ({
  title = "Version 2.0 is now available!",
  description = "Read the full release notes",
  linkText = "here",
  linkUrl = "#",
  defaultVisible = true,
}: Banner1Props) => {
  const [isVisible, setIsVisible] = useState(defaultVisible);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <section className="w-full bg-primary/[0.03] border-b border-primary/10 px-4 py-2.5 sm:py-3 selection:bg-primary/30">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex-1 flex items-center justify-center gap-2 text-center">
          <p className="text-sm tracking-tight text-foreground/90">
            <span className="font-semibold">{title}</span>{" "}
            <span className="text-muted-foreground font-medium">
              {description}{" "}
              <a
                href={linkUrl}
                className="text-primary hover:text-primary/80 font-semibold underline underline-offset-4 transition-colors"
              >
                {linkText}
              </a>
            </span>
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="-mr-2 h-8 w-8 flex-none hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors rounded-md"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};

export { Banner1 };
