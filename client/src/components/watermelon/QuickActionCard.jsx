import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown01Icon } from "./WatermelonIcons";
import { cn } from "@/lib/utils";

export function QuickActionCard({
  icon: Icon,
  label,
  description,
  onClick,
  accentColor = "var(--primary)",
  iconBg,
  className,
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "group/card bg-secondary/80 text-secondary-foreground cursor-pointer rounded-xl border border-border/40 py-0 shadow-xs transition-all duration-200 hover:border-border hover:bg-secondary hover:shadow-md active:scale-[0.99]",
        className
      )}
    >
      <CardContent className="flex h-full items-center justify-between p-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "bg-background/90 flex size-10 items-center justify-center rounded-lg border border-white/5 shrink-0 transition-transform group-hover/card:scale-105",
              iconBg
            )}
            style={{ color: accentColor }}
          >
            {Icon && <Icon className="size-5" />}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-secondary-foreground font-semibold text-sm truncate group-hover/card:text-foreground">
              {label}
            </span>
            {description && (
              <span className="text-muted-foreground text-xs truncate">
                {description}
              </span>
            )}
          </div>
        </div>
        <ArrowDown01Icon className="text-muted-foreground size-5 -rotate-90 shrink-0 transition-all duration-200 ease-out group-hover/card:translate-x-1 group-hover/card:text-foreground" />
      </CardContent>
    </Card>
  );
}
