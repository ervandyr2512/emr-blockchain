import React from "react";
import { clsx } from "clsx";

interface SpinnerProps {
  size?:    "sm" | "md" | "lg";
  label?:   string;
  center?:  boolean;
}

export function Spinner({ size = "md", label, center }: SpinnerProps) {
  const sizes = { sm: "w-4 h-4 border-2", md: "w-8 h-8 border-2", lg: "w-12 h-12 border-3" };
  const spinner = (
    <div
      className={clsx(
        "rounded-full border-primary-200 border-t-primary-600 animate-spin",
        sizes[size]
      )}
      role="status"
      aria-label={label || "Loading"}
    />
  );
  if (center) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        {spinner}
        {label && <p className="text-sm text-slate-500">{label}</p>}
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-2">
      {spinner}
      {label && <span className="text-sm text-slate-500">{label}</span>}
    </div>
  );
}
