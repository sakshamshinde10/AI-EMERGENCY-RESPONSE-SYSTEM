import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  icon: Icon,
  iconClassName,
  iconBg,
  label,
  value,
  note,
  noteIcon: NoteIcon,
  trend = "neutral", // "up" | "down" | "neutral"
  className,
}) {
  const noteParts = typeof note === "string" ? note.match(/^([+-]?\d+(?:\.\d+)?%?|↓\s*\d+|↑\s*\d+)\s+(.*)$/) : null;

  return (
    <Card
      className={cn(
        "bg-secondary text-secondary-foreground gap-4 rounded-xl p-4.5 border border-border/40 shadow-xs transition-all duration-200 hover:border-border/80 hover:bg-secondary/90",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-lg border border-white/5",
                iconBg || "bg-background/80"
              )}
            >
              <Icon className={cn("size-4.5 shrink-0", iconClassName || "text-foreground")} />
            </div>
          )}
          <span className="text-secondary-foreground/80 text-xs font-semibold uppercase tracking-wider">
            {label}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <h3 className="text-foreground text-3xl font-bold tracking-tight leading-none">
          {value}
        </h3>
        {note && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {NoteIcon && <NoteIcon className="size-3.5 shrink-0" />}
            {noteParts ? (
              <>
                <span
                  className={cn(
                    "font-semibold px-1.5 py-0.5 rounded text-[11px]",
                    trend === "up"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : trend === "down"
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : "bg-muted text-secondary-foreground"
                  )}
                >
                  {noteParts[1]}
                </span>
                <span className="text-muted-foreground text-[11px] truncate">{noteParts[2]}</span>
              </>
            ) : (
              <span className="text-muted-foreground text-[11px]">{note}</span>
            )}
          </p>
        )}
      </div>
    </Card>
  );
}
