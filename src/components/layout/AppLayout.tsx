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
  Lightbulb
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
      { name: 'Goals', href: '/', icon: Target },
      { name: 'Brainstorming', href: '/brainstorming', icon: Lightbulb },
      { name: 'Boards', href: '/boards', icon: Kanban },
      { name: 'Kalender', href: '/calendar', icon: Calendar },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ]
  }
]

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<string[]>([])

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
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Mobile sidebar backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-[#0a0a0a] flex flex-col transition-all duration-300 ease-out",
          sidebarOpen ? "lg:w-[240px]" : "lg:w-0 lg:overflow-hidden",
          mobileOpen ? "w-[240px]" : "w-0 -translate-x-full lg:translate-x-0"
        )}
      >
        <div className={cn(
          "flex flex-col h-full min-w-[240px]",
          (sidebarOpen || mobileOpen) ? "opacity-100" : "lg:opacity-0"
        )}>
          {/* Logo Section */}
          <div className="h-14 px-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden bg-white">
                <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
              </div>
              <span className="font-semibold text-[15px] text-white">Content OS</span>
            </Link>
            <button
              className="lg:hidden h-7 w-7 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
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
                      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                        {section.title}
                      </span>
                      <ChevronDown 
                        className={cn(
                          "h-3.5 w-3.5 text-gray-600 transition-transform",
                          isCollapsed && "-rotate-90"
                        )} 
                      />
                    </button>
                  ) : (
                    <p className="px-2 mb-2 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
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
                                ? "bg-white/[0.08] text-white"
                                : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                            )}
                          >
                            <item.icon 
                              className="h-4 w-4 stroke-[1.5]" 
                              style={item.color ? { color: item.color } : undefined}
                            />
                            {item.name}
                            {item.children && (
                              <ChevronRight className="h-3.5 w-3.5 ml-auto text-gray-600" />
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
          <div className="px-3 pb-3 border-t border-white/[0.06] pt-3">
            <Link
              to="/settings"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px] transition-all",
                location.pathname === '/settings'
                  ? "bg-white/[0.08] text-white"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
              )}
            >
              <Settings className="h-4 w-4 stroke-[1.5]" />
              Einstellungen
            </Link>

            {/* User Profile */}
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-900 text-[12px] font-medium">
                  S
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[13px] text-gray-300 truncate">Simon Schaefer</p>
                  <p className="text-[11px] text-gray-500 truncate">simon@scale...</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-out",
          sidebarOpen ? "lg:pl-[240px]" : "lg:pl-0"
        )}
      >
        {/* Content Window */}
        <div className="flex-1 lg:p-2">
          <div className="h-full bg-white lg:rounded-2xl lg:shadow-xl overflow-hidden flex flex-col">
            {/* Header */}
            <header className="h-12 border-b border-gray-100 flex items-center px-4 gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-8 w-8 text-gray-500 hover:text-gray-700"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hidden lg:flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <PanelLeftClose className={cn("h-4 w-4 transition-transform duration-300", !sidebarOpen && "rotate-180")} />
                </button>
              </div>

              <div className="flex-1 flex justify-center">
                <button className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200/80 transition-colors text-gray-400 text-[13px] w-full max-w-md">
                  <Search className="w-4 h-4" />
                  <span>Suchen...</span>
                  <kbd className="ml-auto text-[10px] font-medium text-gray-400 px-1.5 py-0.5 rounded border border-gray-200">⌘ K</kbd>
                </button>
              </div>

              <div className="w-8" />
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto bg-[#fafafa]">
              <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8 lg:py-10">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
