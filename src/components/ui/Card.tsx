import React from "react";
import { clsx } from "clsx";

interface CardProps {
  children:  React.ReactNode;
  className?: string;
  padding?:   "none" | "sm" | "md" | "lg";
  hover?:     boolean;
}

export function Card({ children, className, padding = "md", hover = false }: CardProps) {
  const paddings = { none: "", sm: "p-4", md: "p-6", lg: "p-8" };
  return (
    <div
      className={clsx(
        "bg-white rounded-2xl shadow-card border border-slate-100",
        paddings[padding],
        hover && "transition-shadow hover:shadow-md cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title:     string;
  value:     string | number;
  icon:      React.ReactNode;
  color?:    "blue" | "teal" | "amber" | "green" | "red" | "purple";
  subtitle?: string;
  trend?:    { value: number; label: string };
}

const colorMap = {
  blue:   { bg: "bg-primary-50",  icon: "text-primary-600",  border: "border-primary-100" },
  teal:   { bg: "bg-teal-50",     icon: "text-teal-600",     border: "border-teal-100"    },
  amber:  { bg: "bg-amber-50",    icon: "text-amber-600",    border: "border-amber-100"   },
  green:  { bg: "bg-green-50",    icon: "text-green-600",    border: "border-green-100"   },
  red:    { bg: "bg-red-50",      icon: "text-red-600",      border: "border-red-100"     },
  purple: { bg: "bg-purple-50",   icon: "text-purple-600",   border: "border-purple-100"  },
};

export function StatCard({ title, value, icon, color = "blue", subtitle, trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <Card className="flex items-start gap-4">
      <div className={clsx("p-3 rounded-xl border", c.bg, c.border)}>
        <span className={clsx("w-6 h-6 block", c.icon)}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        {trend && (
          <p className={clsx("text-xs mt-1 font-medium", trend.value >= 0 ? "text-green-600" : "text-red-600")}>
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </Card>
  );
}
