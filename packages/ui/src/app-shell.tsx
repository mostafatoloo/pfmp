"use client";

import { useState, type ReactNode } from "react";
import { APP_NAV, type NavItem } from "./nav";

export type AppShellProps = {
  children: ReactNode;
  brand?: string;
  pathname?: string;
  locale?: string;
  dir?: "ltr" | "rtl";
  /** Resolved nav labels (already translated by caller) */
  labels?: Record<string, string>;
  footer?: ReactNode;
  headerExtra?: ReactNode;
};

export function AppShell({
  children,
  brand = "PFMP",
  pathname = "/today",
  locale = "en",
  dir = "ltr",
  labels = {},
  footer,
  headerExtra,
}: AppShellProps) {
  const items: NavItem[] = APP_NAV;
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div
      className="pfmp-shell"
      dir={dir}
      data-locale={locale}
      data-nav-open={navOpen ? "true" : "false"}
    >
      <header className="pfmp-header">
        <a className="pfmp-brand" href="/today">
          {brand}
        </a>
        <button
          type="button"
          className="pfmp-nav-toggle"
          aria-expanded={navOpen}
          aria-controls="pfmp-primary-nav"
          onClick={() => setNavOpen((o) => !o)}
        >
          Menu
        </button>
        <nav className="pfmp-nav" id="pfmp-primary-nav" aria-label={labels["nav.primary"] ?? "Primary"}>
          <ul>
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const label = labels[item.labelKey] ?? item.labelKey;
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setNavOpen(false)}
                  >
                    {label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        {headerExtra}
      </header>
      <main className="pfmp-main">{children}</main>
      {footer ? <footer className="pfmp-footer">{footer}</footer> : null}
    </div>
  );
}
