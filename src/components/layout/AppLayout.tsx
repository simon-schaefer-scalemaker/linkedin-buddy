import { Link, useLocation } from 'react-router-dom'
import {
  Target,
  Calendar,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  PanelLeftClose,
  Kanban,
  Lightbulb,
  Bot,
  Sun,
  Moon
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ManagerChat } from '@/components/manager/ManagerChat'
import { useThemeStore } from '@/stores/themeStore'

interface AppLayoutProps {
  children: React.ReactNode
}

interface NavSection {
  title: string
  items: NavItem[]
  collapsible?: boolean
}

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  color?: string
  children?: { name: string; href: string }[]
}

const navSections: NavSection[] = [
  {
    title: 'Übersicht',
    items: [
      { name: 'OKRs', href: '/', icon: Target },
      { name: 'Boards', href: '/boards', icon: Kanban },
      { name: 'Kalender', href: '/calendar', icon: Calendar },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Brainstorming', href: '/brainstorming', icon: Lightbulb },
    ]
  }
]

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<string[]>([])
  const [managerOpen, setManagerOpen] = useState(false)
  const { theme, toggleTheme } = useThemeStore()

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    )
  }

  const isActiveLink = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  return (
    <div className={cn(
      "min-h-screen flex",
      // Light mode - very subtle gray
      "bg-neutral-50",
      // Dark mode
      "dark:bg-[#0a0a0a]"
    )}>
      {/* Mobile sidebar backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm xl:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-out",
          // Light mode - match outer background
          "bg-neutral-50",
          // Dark mode
          "dark:bg-[#0a0a0a]",
          // Desktop: show/hide based on sidebarOpen
          sidebarOpen ? "xl:w-[200px]" : "xl:w-0 xl:overflow-hidden",
          // Mobile/Tablet: show/hide based on mobileOpen
          mobileOpen ? "w-[200px] translate-x-0" : "w-[200px] -translate-x-full xl:translate-x-0"
        )}
      >
        <div className={cn(
          "flex flex-col h-full min-w-[200px]",
          (sidebarOpen || mobileOpen) ? "opacity-100" : "xl:opacity-0"
        )}>
          {/* Logo Section */}
          <div className="h-14 px-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden bg-neutral-900 dark:bg-white">
                <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
              </div>
              <span className="font-semibold text-[15px] text-neutral-900 dark:text-white">Content OS</span>
            </Link>
            <button
              className={cn(
                "xl:hidden h-7 w-7 rounded-md flex items-center justify-center transition-colors",
                "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100",
                "dark:text-neutral-500 dark:hover:text-white dark:hover:bg-white/10"
              )}
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar">
            {navSections.map((section) => {
              const isCollapsed = collapsedSections.includes(section.title)
              
              return (
                <div key={section.title} className="mb-6">
                  {/* Section Header */}
                  {section.collapsible ? (
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between px-2 mb-2 group"
                    >
                      <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                        {section.title}
                      </span>
                      <ChevronDown 
                        className={cn(
                          "h-3.5 w-3.5 text-neutral-500 transition-transform",
                          isCollapsed && "-rotate-90"
                        )} 
                      />
                    </button>
                  ) : (
                    <p className="px-2 mb-2 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                      {section.title}
                    </p>
                  )}

                  {/* Section Items */}
                  {!isCollapsed && (
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const isActive = isActiveLink(item.href)
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px] transition-all",
                              isActive
                                ? "bg-neutral-100 text-neutral-900 dark:bg-white/[0.08] dark:text-white"
                                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 dark:text-neutral-500 dark:hover:text-white dark:hover:bg-white/[0.04]"
                            )}
                          >
                            <item.icon 
                              className="h-4 w-4 stroke-[1.5]" 
                              style={item.color ? { color: item.color } : undefined}
                            />
                            {item.name}
                            {item.children && (
                              <ChevronRight className="h-3.5 w-3.5 ml-auto text-neutral-500" />
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Bottom Section */}
          <div className={cn(
            "px-3 pb-3 pt-3",
            "border-t border-neutral-200 dark:border-white/[0.06]"
          )}>
            <Link
              to="/settings"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px] transition-all",
                location.pathname === '/settings'
                  ? "bg-neutral-100 text-neutral-900 dark:bg-white/[0.08] dark:text-white"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 dark:text-neutral-500 dark:hover:text-white dark:hover:bg-white/[0.04]"
              )}
            >
              <Settings className="h-4 w-4 stroke-[1.5]" />
              Einstellungen
            </Link>

            {/* User Profile */}
            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-white/[0.06]">
              <button className={cn(
                "w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors group",
                "hover:bg-neutral-50 dark:hover:bg-white/[0.04]"
              )}>
                <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-black text-[12px] font-medium">
                  S
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[13px] text-neutral-700 dark:text-neutral-300 truncate">Simon Schaefer</p>
                  <p className="text-[11px] text-neutral-500 truncate">simon@scale...</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-500 transition-colors shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-out",
          sidebarOpen ? "xl:pl-[200px]" : "xl:pl-0"
        )}
      >
        {/* Content Window */}
        <div className="flex-1 p-2">
          <div className={cn(
            "h-full overflow-hidden flex flex-col rounded-2xl",
            // Light mode
            "bg-white shadow-sm",
            // Dark mode
            "dark:bg-neutral-950 dark:border dark:border-neutral-800/50 dark:shadow-none"
          )}>
            {/* Header */}
            <header className={cn(
              "h-14 flex items-center px-4 gap-4 shrink-0 sticky top-0 z-10",
              "border-b border-neutral-200 bg-white/80 backdrop-blur-lg",
              "dark:border-white/5 dark:bg-neutral-950/80"
            )}>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="xl:hidden h-8 w-8"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={cn(
                    "hidden xl:flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                    "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100",
                    "dark:text-neutral-500 dark:hover:text-white dark:hover:bg-white/10"
                  )}
                >
                  <PanelLeftClose className={cn("h-4 w-4 transition-transform duration-300", !sidebarOpen && "rotate-180")} />
                </button>
              </div>

              <div className="flex-1 flex justify-center">
                <button className={cn(
                  "hidden sm:flex items-center gap-2 h-9 px-4 rounded-full transition-colors text-[13px] w-full max-w-md",
                  // Light mode
                  "bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-500",
                  // Dark mode
                  "dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:border-neutral-800 dark:text-neutral-500"
                )}>
                  <Search className="w-4 h-4" />
                  <span>Suchen...</span>
                  <kbd className={cn(
                    "ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded",
                    "text-neutral-500 bg-white border border-neutral-200",
                    "dark:text-neutral-600 dark:bg-neutral-800 dark:border-neutral-700"
                  )}>⌘ K</kbd>
                </button>
              </div>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              {/* Manager Button */}
              <Button
                size="sm"
                onClick={() => setManagerOpen(true)}
                className="gap-2"
              >
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Manager</span>
              </Button>
            </header>

            {/* Page Content */}
            <main className={cn(
              "flex-1 overflow-y-auto",
              "bg-white dark:bg-neutral-950"
            )}>
              <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-6 lg:py-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Manager Chat */}
      <ManagerChat open={managerOpen} onOpenChange={setManagerOpen} />
    </div>
  )
}
