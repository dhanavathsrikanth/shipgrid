"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const toggleOption = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  const removeOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== option));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-auto min-h-11 px-3 py-2 rounded-xl border-input hover:bg-muted/50 transition-all text-sm font-medium",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {selected.length === 0 && (
              <span className="text-muted-foreground font-medium ml-1">{placeholder}</span>
            )}
            {selected.map((option) => (
              <Badge
                key={option}
                variant="secondary"
                className="rounded-lg px-2 py-0 gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors text-[10px] font-bold"
                onClick={(e) => removeOption(option, e)}
              >
                {option}
                <X className="h-3 w-3 cursor-pointer" />
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl shadow-2xl border overflow-hidden" align="start">
        <div className="max-h-[300px] overflow-y-auto p-1 space-y-0.5">
          {options.map((option) => (
            <div
              key={option}
              className={cn(
                "flex items-center space-x-2.5 p-2 rounded-lg cursor-pointer transition-colors text-sm",
                selected.includes(option) 
                  ? "bg-primary/5 text-primary" 
                  : "hover:bg-muted/70"
              )}
              onClick={() => toggleOption(option)}
            >
              <Checkbox
                id={`option-${option}`}
                checked={selected.includes(option)}
                className="rounded border"
                onCheckedChange={() => toggleOption(option)}
              />
              <span className="font-semibold select-none">{option}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
