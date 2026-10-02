import React, { useId, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDown01Icon } from "./WatermelonIcons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, Activity, Zap } from "lucide-react";

export function CirculationActivityChart({
  title = "Incident Traffic & Resolution",
  subtitle = "Real-time dispatch response trends",
  dataByTimeframe,
  timeframeOptions = ["24h", "weekly", "monthly"],
  defaultTimeframe = "24h",
  primaryKey = "emergencies",
  primaryLabel = "Incoming Emergencies",
  primaryColor = "#3B82F6",
  secondaryKey = "resolved",
  secondaryLabel = "Resolved Cases",
  secondaryColor = "#10B981",
  height = 290,
  className,
}) {
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const gradientId = useId().replace(/:/g, "");

  const activeData = dataByTimeframe?.[timeframe] || [
    { label: "00:00", [primaryKey]: 4, [secondaryKey]: 2 },
    { label: "04:00", [primaryKey]: 2, [secondaryKey]: 1 },
    { label: "08:00", [primaryKey]: 9, [secondaryKey]: 6 },
    { label: "12:00", [primaryKey]: 15, [secondaryKey]: 11 },
    { label: "16:00", [primaryKey]: 19, [secondaryKey]: 14 },
    { label: "20:00", [primaryKey]: 12, [secondaryKey]: 10 },
    { label: "23:59", [primaryKey]: 6, [secondaryKey]: 5 },
  ];

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-border/40 bg-card p-5 shadow-xs",
        className
      )}
    >
      <div className="flex w-full items-center justify-between gap-2 pb-3 border-b border-border/30">
        <div>
          <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
            <Activity className="size-4 text-primary" style={{ color: primaryColor }} />
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="text-secondary-foreground/80">{primaryLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: secondaryColor }}
              />
              <span className="text-secondary-foreground/80">{secondaryLabel}</span>
            </div>
          </div>

          {/* Timeframe selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs capitalize border-border/60 bg-secondary/50 font-semibold"
              >
                <span>{timeframe}</span>
                <ArrowDown01Icon className="size-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 p-1.5 shadow-xl">
              <DropdownMenuGroup>
                {timeframeOptions.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setTimeframe(option)}
                    className={cn(
                      "rounded-md capitalize text-xs cursor-pointer",
                      timeframe === option && "text-primary font-bold bg-muted"
                    )}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-4 w-full flex-1" style={{ minHeight: height }}>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={activeData}
            margin={{ left: -15, right: 10, top: 12, bottom: 4 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="label"
              stroke="rgba(255,255,255,0.4)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.4)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-[#111827] text-white border border-white/10 z-50 flex min-w-44 flex-col rounded-lg p-3 shadow-xl backdrop-blur-md">
                    <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-white/10 text-[11px] font-semibold text-slate-300">
                      <Calendar className="size-3 text-slate-400" />
                      <span>{label}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {payload.map((entry, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-4 text-xs"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="size-2 rounded-full shrink-0"
                              style={{ backgroundColor: entry.color || entry.fill }}
                            />
                            <span className="text-slate-300">
                              {entry.name === primaryKey ? primaryLabel : secondaryLabel}
                            </span>
                          </div>
                          <span className="font-bold text-white tabular-nums">
                            {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey={primaryKey}
              stroke={primaryColor}
              strokeWidth={2.2}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              activeDot={{
                r: 5,
                stroke: primaryColor,
                strokeWidth: 2,
                fill: "#111827",
              }}
            />
            <Line
              type="monotone"
              dataKey={secondaryKey}
              stroke={secondaryColor}
              strokeWidth={1.8}
              dot={false}
              activeDot={{
                r: 4,
                stroke: secondaryColor,
                strokeWidth: 2,
                fill: "#111827",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
