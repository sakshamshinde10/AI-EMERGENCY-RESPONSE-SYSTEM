import React from "react";
import { Shield, Flame, Activity, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function RecentActivityFeed({
  title = "Recent Department Activity",
  activities = [],
  className,
}) {
  const getDeptIcon = (dept) => {
    switch (dept?.toLowerCase()) {
      case "police":
        return { Icon: Shield, color: "#3B82F6", bg: "rgba(59, 130, 246, 0.12)" };
      case "fire":
      case "fire brigade":
        return { Icon: Flame, color: "#EF4444", bg: "rgba(239, 68, 68, 0.12)" };
      case "hospital":
        return { Icon: Activity, color: "#10B981", bg: "rgba(16, 185, 129, 0.12)" };
      default:
        return { Icon: Clock, color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.12)" };
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
        <h2 className="text-base font-bold text-foreground tracking-tight">
          {title}
        </h2>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Live Feed
        </span>
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-3.5 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-muted-foreground">
            No recent activity recorded yet.
          </div>
        ) : (
          activities.slice(0, 7).map((item, idx) => {
            const deptStyle = getDeptIcon(item.department);
            const DeptIcon = deptStyle.Icon;
            return (
              <div
                key={item.id || item._id || idx}
                className="group flex items-start gap-3 p-2 rounded-lg transition-colors hover:bg-secondary/60"
              >
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/5"
                  style={{
                    backgroundColor: deptStyle.bg,
                    color: deptStyle.color,
                  }}
                >
                  <DeptIcon className="size-4" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {item.title || item.name || "Emergency Incident"}
                    </span>
                    <time className="text-[11px] text-muted-foreground shrink-0">
                      {item.time || (item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now")}
                    </time>
                  </div>

                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {item.description || item.situation || item.location}
                  </p>

                  <div className="flex items-center gap-2 mt-0.5">
                    {item.department && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded"
                        style={{
                          color: deptStyle.color,
                          backgroundColor: deptStyle.bg,
                        }}
                      >
                        {item.department}
                      </span>
                    )}
                    {item.status && (
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 px-1.5 capitalize border-border/60"
                      >
                        {item.status}
                      </Badge>
                    )}
                    {item.priority && (
                      <span
                        className={cn(
                          "text-[10px] font-semibold",
                          item.priority.toLowerCase() === "critical"
                            ? "text-rose-400"
                            : item.priority.toLowerCase() === "high"
                            ? "text-amber-400"
                            : "text-emerald-400"
                        )}
                      >
                        • {item.priority}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
