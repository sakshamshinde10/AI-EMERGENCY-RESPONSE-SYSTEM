import React, { useState } from "react";
import { SparklesIcon, CancelIcon, ArrowDown01Icon } from "./WatermelonIcons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export function IntelligenceFeed({
  title = "AI Incident Intelligence & Advisory",
  items = [],
  onActionClick,
  className,
}) {
  const [cards, setCards] = useState(items);

  const handleDismiss = (id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const getToneStyle = (tone) => {
    switch (tone) {
      case "critical":
        return {
          textColor: "#EF4444",
          badgeBg: "rgba(239, 68, 68, 0.12)",
          borderColor: "rgba(239, 68, 68, 0.25)",
        };
      case "warning":
        return {
          textColor: "#F59E0B",
          badgeBg: "rgba(245, 158, 11, 0.12)",
          borderColor: "rgba(245, 158, 11, 0.25)",
        };
      case "success":
        return {
          textColor: "#10B981",
          badgeBg: "rgba(16, 185, 129, 0.12)",
          borderColor: "rgba(16, 185, 129, 0.25)",
        };
      case "insight":
      default:
        return {
          textColor: "#A855F7",
          badgeBg: "rgba(168, 85, 247, 0.12)",
          borderColor: "rgba(168, 85, 247, 0.25)",
        };
    }
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-border/40 bg-card p-5 shadow-xs",
        className
      )}
    >
      <div className="flex items-center justify-between pb-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-purple-400" />
          <h2 className="text-base font-bold text-foreground tracking-tight">
            {title}
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {cards.length} Active
        </span>
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto">
        {cards.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-muted-foreground">
            All AI advisories resolved. AI monitoring active in background.
          </div>
        ) : (
          cards.map((card) => {
            const toneStyle = getToneStyle(card.tone);
            return (
              <Card
                key={card.id}
                className="bg-secondary/70 text-secondary-foreground rounded-xl border border-border/30 py-0 shadow-none transition-all hover:bg-secondary hover:border-border/60"
              >
                <CardContent className="flex flex-col gap-2.5 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-md"
                      style={{
                        color: toneStyle.textColor,
                        backgroundColor: toneStyle.badgeBg,
                        border: `1px solid ${toneStyle.borderColor}`,
                      }}
                    >
                      <SparklesIcon className="size-3.5" />
                      <span className="truncate">{card.title}</span>
                    </div>

                    <Button
                      aria-label="Dismiss"
                      variant="ghost"
                      size="icon-xs"
                      className="size-6 text-muted-foreground hover:text-foreground hover:bg-muted"
                      onClick={() => handleDismiss(card.id)}
                    >
                      <CancelIcon className="size-3.5" />
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                      {card.description}
                    </p>

                    {card.actionLabel && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 gap-1.5 rounded-lg px-2.5 text-xs font-semibold shrink-0 bg-background/80 hover:bg-background border border-white/5"
                        onClick={() => onActionClick?.(card)}
                      >
                        <span>{card.actionLabel}</span>
                        <ArrowDown01Icon className="size-3.5 -rotate-90" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
