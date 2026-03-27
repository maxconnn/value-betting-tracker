import { useState, type ReactNode } from 'react';

export interface AppShellSection {
  id: string;
  label: string;
  description: string;
  meta?: string;
}

interface AppShellProps {
  appTitle: string;
  appSubtitle: string;
  sections: AppShellSection[];
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
  headerTitle: string;
  headerDescription: string;
  headerActions?: ReactNode;
  headerSummary?: ReactNode;
  sidebarFooter?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  appTitle,
  appSubtitle,
  sections,
  activeSection,
  onSelectSection,
  headerTitle,
  headerDescription,
  headerActions,
  headerSummary,
  sidebarFooter,
  children,
}: AppShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  function handleSelectSection(sectionId: string) {
    onSelectSection(sectionId);
    setIsMobileSidebarOpen(false);
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="border-b border-slate-800 px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Operations
          </p>
          <h1 className="mt-3 text-xl font-semibold text-white">{appTitle}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">{appSubtitle}</p>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-4">
          {sections.map((section) => {
            const isActive = section.id === activeSection;

            return (
              <button
                key={section.id}
                className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`}
                type="button"
                onClick={() => handleSelectSection(section.id)}
              >
                <div>
                  <p className="text-sm font-semibold">{section.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{section.description}</p>
                </div>
                {section.meta ? <span className="sidebar-nav-meta">{section.meta}</span> : null}
              </button>
            );
          })}
        </nav>

        {sidebarFooter ? <div className="border-t border-slate-800 px-4 py-4">{sidebarFooter}</div> : null}
      </aside>

      <div className="app-main">
        <header className="app-header">
          <div className="space-y-4 px-4 py-4 md:space-y-6 md:px-6 lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-3 md:hidden">
                  <button
                    className="shell-menu-button shell-menu-button-icon"
                    type="button"
                    aria-label="Открыть меню разделов"
                    onClick={() => setIsMobileSidebarOpen(true)}
                  >
                    <span aria-hidden="true" className="shell-menu-icon">
                      <span />
                      <span />
                      <span />
                    </span>
                  </button>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Dashboard
                  </p>
                </div>
                <p className="hidden text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 md:block">
                  Dashboard
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  {headerTitle}
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-slate-400">{headerDescription}</p>
              </div>

              {headerActions ? (
                <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto xl:justify-end">
                  {headerActions}
                </div>
              ) : null}
            </div>

            {headerSummary ? <div className="app-header-summary">{headerSummary}</div> : null}
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>

      {isMobileSidebarOpen ? (
        <div
          className="mobile-drawer-overlay md:hidden"
          role="presentation"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <aside
            className="mobile-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Навигация по разделам"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-800 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Operations
                  </p>
                  <h1 className="mt-2 text-lg font-semibold text-white">{appTitle}</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{appSubtitle}</p>
                </div>
                <button
                  className="shell-menu-button shell-menu-button-icon"
                  type="button"
                  aria-label="Закрыть меню"
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <span aria-hidden="true" className="text-lg leading-none">×</span>
                </button>
              </div>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
              {sections.map((section) => {
                const isActive = section.id === activeSection;

                return (
                  <button
                    key={section.id}
                    className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`}
                    type="button"
                    onClick={() => handleSelectSection(section.id)}
                  >
                    <div>
                      <p className="text-sm font-semibold">{section.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{section.description}</p>
                    </div>
                    {section.meta ? <span className="sidebar-nav-meta">{section.meta}</span> : null}
                  </button>
                );
              })}
            </nav>

            {sidebarFooter ? <div className="border-t border-slate-800 px-4 py-4">{sidebarFooter}</div> : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
