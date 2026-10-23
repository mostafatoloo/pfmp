import type { ReactNode } from "react";
import { APP_NAV, type NavItem } from "./nav";

export type AppShellProps = {
  children: ReactNode;
  brand?: string;
  /** Active path for nav highlight */
  pathname?: string;
  /** When true, use Persian labels and dir=rtl on nav */
  locale?: "en" | "fa";
  dir?: "ltr" | "rtl";
  footer?: ReactNode;
};

export function AppShell({
  children,
  brand = "PFMP",
  pathname = "/today",
  locale = "en",
  dir = "ltr",
  footer,
}: AppShellProps) {
  const items: NavItem[] = APP_NAV;
  return (
    <div className="pfmp-shell" dir={dir} data-locale={locale}>
      <header className="pfmp-header">
        <a className="pfmp-brand" href="/today">
          {brand}
        </a>
        <nav className="pfmp-nav" aria-label="Primary">
          <ul>
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <a href={item.href} aria-current={active ? "page" : undefined}>
                    {locale === "fa" ? item.labelFa : item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <main className="pfmp-main">{children}</main>
      {footer ? <footer className="pfmp-footer">{footer}</footer> : null}
    </div>
  );
}
