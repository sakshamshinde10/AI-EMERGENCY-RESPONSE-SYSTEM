import React from "react";
import { Download01Icon } from "./WatermelonIcons";
import { Button } from "@/components/ui/button";
import { Radio, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardHeader({
  title = "Good Morning, Officer",
  subtitle = "Central Dispatch Control",
  department = "Emergency Services",
  accentColor = "#3B82F6",
  icon: Icon,
  onRefresh,
  onExport,
  isRefreshing = false,
  extraActions,
  className,
}) {
  const currentDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div
      className={cn(
        "flex flex-col items-start justify-between gap-4 pb-6 sm:flex-row sm:items-end border-b border-border/30 mb-6",
        className
      )}
    >
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div
              className="flex size-8 items-center justify-center rounded-lg"
              style={{
                backgroundColor: `${accentColor}15`,
                border: `1px solid ${accentColor}30`,
                color: accentColor,
              }}
            >
              <Icon className="size-4.5" />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
            {title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-secondary-foreground">
            {department}
          </span>
          <span className="size-1 rounded-full bg-border" />
          <span>{subtitle}</span>
          <span className="size-1 rounded-full bg-border" />
          <span className="font-medium text-foreground/80">{currentDate}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-9 gap-1.5 text-xs font-semibold border-border/60 bg-secondary/40 hover:bg-secondary"
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            <span>Sync</span>
          </Button>
        )}

        {onExport && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onExport}
            className="h-9 gap-2 text-xs font-semibold bg-secondary hover:bg-secondary/80 border border-border/50 text-foreground"
          >
            <span>Export Log</span>
            <Download01Icon className="size-3.5" />
          </Button>
        )}

        {extraActions}
      </div>
    </div>
  );
}
