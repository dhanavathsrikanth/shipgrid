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
    <section className="bg-background w-full border-b px-4 py-3 selection:bg-primary/30">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        <div className="flex-1 text-center">
          <span className="text-sm">
            <span className="font-bold text-foreground">{title}</span>{" "}
            <span className="text-muted-foreground font-medium">
              {description}{" "}
              <a
                href={linkUrl}
                className="text-primary hover:text-primary/80 font-bold underline underline-offset-4 transition-colors"
              >
                {linkText}
              </a>
              .
            </span>
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="-mr-2 h-8 w-8 flex-none hover:bg-muted/50 rounded-full"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};

export { Banner1 };
