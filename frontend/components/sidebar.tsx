"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";
import {
  Info,
  Stethoscope,
  Clock,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export type ActiveTab = "about" | "analysis" | "history";

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  className?: string;
}

export function Sidebar({ activeTab, onTabChange, className = "" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      id: "about" as ActiveTab,
      label: "About LumiVue",
      shortLabel: "About",
      description: "Overview & Evidence Firewall",
      icon: Info,
    },
    {
      id: "analysis" as ActiveTab,
      label: "Diagnostic Analysis",
      shortLabel: "Analysis",
      description: "X-ray assessment & vitals",
      icon: Stethoscope,
    },
    {
      id: "history" as ActiveTab,
      label: "Case History",
      shortLabel: "History",
      description: "Previous diagnostic sessions",
      icon: Clock,
    },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r bg-white transition-all duration-300 ease-in-out shrink-0 select-none z-30 ${
        collapsed ? "w-[72px]" : "w-64"
      } ${className}`}
      style={{
        borderColor: "var(--lv-border)",
        boxShadow: "var(--lv-shadow-sm)",
      }}
      aria-label="Main Navigation Sidebar"
    >
      {/* Header with Logo & Toggle */}
      <div
        className="h-[68px] flex items-center justify-between px-4 border-b shrink-0"
        style={{ borderColor: "var(--lv-border)" }}
      >
        <div className="overflow-hidden flex items-center">
          {collapsed ? (
            <div className="flex items-center justify-center w-10">
              <Logo className="[&>div]:hidden" />
            </div>
          ) : (
            <Logo />
          )}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors ml-auto"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-2 pb-2">
          {!collapsed ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Navigation
            </span>
          ) : (
            <div className="h-2" />
          )}
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group relative ${
                isActive
                  ? "bg-blue-50/80 text-blue-600 font-semibold"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-medium"
              }`}
              title={collapsed ? item.label : undefined}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <span
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-blue-600"
                  aria-hidden="true"
                />
              )}

              <Icon
                className={`h-5 w-5 shrink-0 transition-colors ${
                  isActive
                    ? "text-blue-600"
                    : "text-neutral-400 group-hover:text-neutral-600"
                }`}
              />

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate">{item.label}</div>
                  <div className="text-[10px] text-neutral-400 font-normal truncate">
                    {item.description}
                  </div>
                </div>
              )}

              {!collapsed && isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 ml-auto" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Clinical Firewall Status Badge */}
      {!collapsed ? (
        <div className="mx-3 mb-3 p-3 rounded-xl border bg-neutral-50/80 border-neutral-200/70 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold text-neutral-800">
              Evidence Firewall
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 leading-snug">
            Active &bull; Strictly rejecting unsupported clinical findings
          </p>
        </div>
      ) : (
        <div className="flex justify-center mb-3">
          <div
            className="p-2 rounded-xl text-emerald-600 bg-emerald-50"
            title="Evidence Firewall Active"
          >
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      )}

      {/* Footer Profile & Status */}
      <div
        className="p-3 border-t shrink-0 flex items-center gap-3 bg-white"
        style={{ borderColor: "var(--lv-border)" }}
      >
        <div
          className="flex items-center justify-center h-9 w-9 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600 shrink-0"
        >
          <User className="h-4 w-4" />
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-neutral-900 truncate">
              Dr. Clinician
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>System Online</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
