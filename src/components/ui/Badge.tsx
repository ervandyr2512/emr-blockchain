import React from "react";
import { clsx } from "clsx";

type BadgeVariant = "blue" | "teal" | "green" | "amber" | "red" | "purple" | "gray";

interface BadgeProps {
  children:   React.ReactNode;
  variant?:   BadgeVariant;
  size?:      "sm" | "md";
  dot?:       boolean;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  blue:   "bg-primary-100 text-primary-700",
  teal:   "bg-teal-100    text-teal-700",
  green:  "bg-green-100   text-green-700",
  amber:  "bg-amber-100   text-amber-700",
  red:    "bg-red-100     text-red-700",
  purple: "bg-purple-100  text-purple-700",
  gray:   "bg-slate-100   text-slate-600",
};

const dotColors: Record<BadgeVariant, string> = {
  blue:   "bg-primary-500",
  teal:   "bg-teal-500",
  green:  "bg-green-500",
  amber:  "bg-amber-500",
  red:    "bg-red-500",
  purple: "bg-purple-500",
  gray:   "bg-slate-400",
};

export function Badge({ children, variant = "gray", size = "md", dot, className }: BadgeProps) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";
  return (
    <span className={clsx("inline-flex items-center gap-1.5 font-medium rounded-full", sizeClass, variants[variant], className)}>
      {dot && <span className={clsx("w-1.5 h-1.5 rounded-full", dotColors[variant])} />}
      {children}
    </span>
  );
}

/** Map patient status → badge variant */
export function statusBadge(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    registered:     "gray",
    waiting:        "amber",
    assigned:       "blue",
    in_examination: "teal",
    completed:      "green",
    discharged:     "purple",
    pending:        "amber",
    processing:     "blue",
    dispensed:      "green",
    cancelled:      "red",
  };
  return map[status] ?? "gray";
}

export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    registered:     "Terdaftar",
    waiting:        "Menunggu",
    assigned:       "Ditugaskan",
    in_examination: "Pemeriksaan",
    completed:      "Selesai",
    discharged:     "Dipulangkan",
    pending:        "Pending",
    processing:     "Diproses",
    dispensed:      "Diserahkan",
    cancelled:      "Dibatalkan",
  };
  return (
    <Badge variant={statusBadge(status)} dot>
      {labels[status] ?? status}
    </Badge>
  );
}
