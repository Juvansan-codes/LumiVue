"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { User, Activity } from "lucide-react";

const navLinks = [
  { href: "/", label: "Analysis" },
  { href: "/history", label: "History" },
  { href: "/model", label: "Model" },
  { href: "/about", label: "About" },
] as const;

export function Navbar() {
  const [activeLink] = useState("/");

  return (
    <nav
      className="sticky top-0 z-50 flex h-[68px] items-center justify-between border-b bg-white px-6 lg:px-8"
      style={{ borderColor: "var(--lv-border)" }}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-8">
        <Link href="/" aria-label="LumiVue Home">
          <Logo />
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-3 py-2 text-sm font-medium transition-colors rounded-lg"
              style={{
                color:
                  activeLink === link.href
                    ? "var(--lv-blue)"
                    : "var(--lv-muted)",
              }}
              onMouseEnter={(e) => {
                if (activeLink !== link.href) {
                  (e.target as HTMLElement).style.color =
                    "var(--lv-black)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeLink !== link.href) {
                  (e.target as HTMLElement).style.color =
                    "var(--lv-muted)";
                }
              }}
            >
              {link.label}
              {activeLink === link.href && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                  style={{ background: "var(--lv-blue)" }}
                />
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Right: Status + Profile */}
      <div className="flex items-center gap-4">
        {/* System Status */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium" style={{ color: "var(--lv-muted)" }}>
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "var(--lv-success)" }}
            aria-label="System status: ready"
          />
          <span>System Ready</span>
        </div>

        {/* Activity indicator */}
        <button
          className="hidden sm:flex items-center justify-center h-9 w-9 rounded-lg transition-colors"
          style={{ color: "var(--lv-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--lv-border-light)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
          aria-label="Activity"
        >
          <Activity className="h-4 w-4" />
        </button>

        {/* Profile Button */}
        <button
          className="flex items-center justify-center h-9 w-9 rounded-lg transition-colors"
          style={{
            border: "1px solid var(--lv-border)",
            color: "var(--lv-muted)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--lv-border-light)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
          aria-label="Doctor profile"
        >
          <User className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
