"use client";

import React from "react";
import { Bell, Search, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  title:    string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { profile } = useAuth();
  return (
    <header className="h-16 bg-white border-b border-slate-100 shadow-nav flex items-center px-6 gap-4 flex-shrink-0">
      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-lg font-bold text-slate-800 leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications (decorative) */}
        <button className="relative p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User chip */}
        {profile && (
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
              {profile.name[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">
              {profile.name}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
          </button>
        )}
      </div>
    </header>
  );
}
