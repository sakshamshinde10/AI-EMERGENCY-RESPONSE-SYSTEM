import React, { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DualDonutChart({
  title = "Resource & Incident Breakdown",
  label = "Total Active",
  segments = [],
  size = 180,
  className,
}) {
  const [activeIndex, setActiveIndex] = useState(null);

  const total = segments.reduce((sum, seg) => sum + (seg.value || seg.count || 0), 0);
  const normalizedSegments = segments.map((seg) => {
    const val = seg.value || seg.count || 0;
    const percentage = total > 0 ? (val / total) * 100 : 0;
    return {
      name: seg.name || seg.label,
      value: val,
      fill: seg.color || seg.fill || "#3B82F6",
      percentage,
    };
  });

  const activeDatum = activeIndex !== null ? normalizedSegments[activeIndex] : null;
  const displayValue = activeDatum ? activeDatum.value : total;
  const displayLabel = activeDatum ? activeDatum.name : label;

  const center = size / 2;
  const deepOuter = center - 1;
  const deepInner = deepOuter - 8;
  const lightOuter = deepInner;
  const lightInner = deepOuter - 31;
  const paddingAngle = 3;

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-border/40 bg-card p-5 shadow-xs",
        className
      )}
    >
      <div className="pb-3 border-b border-border/30">
        <h2 className="text-base font-bold text-foreground tracking-tight">{title}</h2>
      </div>

      <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-6 sm:flex-row sm:items-center">
        {/* Dual Rim Interactive Donut Chart */}
        <div
          className="relative shrink-0 select-none"
          style={{ width: size, height: size }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <PieChart
            width={size}
            height={size}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            {/* Thick lighter inner body */}
            <Pie
              data={normalizedSegments}
              cx={center}
              cy={center}
              dataKey="value"
              innerRadius={lightInner}
              outerRadius={lightOuter}
              paddingAngle={paddingAngle}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive
              animationDuration={600}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {normalizedSegments.map((entry, index) => (
                <Cell
                  key={`light-${index}`}
                  fill={entry.fill}
                  fillOpacity={0.4}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                  style={{ transition: "opacity 200ms ease-in-out", cursor: "pointer" }}
                />
              ))}
            </Pie>

            {/* Thin deep outer strip */}
            <Pie
              data={normalizedSegments}
              cx={center}
              cy={center}
              dataKey="value"
              innerRadius={deepInner}
              outerRadius={deepOuter}
              paddingAngle={paddingAngle}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive
              animationDuration={600}
              pointerEvents="none"
            >
              {normalizedSegments.map((entry, index) => (
                <Cell
                  key={`deep-${index}`}
                  fill={entry.fill}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                  style={{ transition: "opacity 200ms ease-in-out" }}
                />
              ))}
            </Pie>
            <Tooltip content={() => null} cursor={false} />
          </PieChart>

          {/* Centered live counter */}
          <div
            className="pointer-events-none absolute flex flex-col items-center justify-center text-center"
            style={{
              width: lightInner * 2,
              height: lightInner * 2,
              top: center - lightInner,
              left: center - lightInner,
            }}
          >
            <div className="flex flex-col items-center justify-center transition-all">
              <span className="text-foreground text-2xl font-bold tracking-tight leading-none">
                {displayValue.toLocaleString()}
              </span>
              <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider mt-1 truncate max-w-[80px]">
                {displayLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="flex w-full flex-1 flex-col gap-2 min-w-0">
          {normalizedSegments.map((segment, index) => (
            <div
              key={segment.name}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className={cn(
                "group flex items-center justify-between gap-3 text-xs p-1.5 rounded-lg transition-all duration-150 cursor-pointer hover:bg-secondary",
                activeIndex !== null && activeIndex !== index && "opacity-40"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="size-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: segment.fill }}
                />
                <span className="truncate text-secondary-foreground font-medium group-hover:text-foreground">
                  {segment.name}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold text-foreground tabular-nums">
                  {segment.value.toLocaleString()}
                </span>
                <span className="text-muted-foreground tabular-nums text-[11px] w-9 text-right font-medium">
                  {segment.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
