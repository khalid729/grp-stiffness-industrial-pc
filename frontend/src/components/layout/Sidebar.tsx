import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Gamepad2, 
  Settings, 
  History,
  Menu,
  X,
  Languages,
  Settings2,
  Bell
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const navItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/manual', icon: Gamepad2, labelKey: 'nav.manual' },
  { path: '/test-setup', icon: Settings2, labelKey: 'nav.testSetup' },
  { path: '/alarms', icon: Bell, labelKey: 'nav.alarms' },
  { path: '/history', icon: History, labelKey: 'nav.history' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

interface SidebarProps {
  children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t, language, setLanguage, isRTL } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-sidebar-accent text-sidebar-foreground touch-none"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <h1 className="text-lg font-bold text-sidebar-foreground">
          GRP Stiffness Test
        </h1>
        <button
          onClick={toggleLanguage}
          className="p-2 rounded-lg bg-sidebar-accent text-sidebar-foreground touch-none"
        >
          <Languages className="w-5 h-5" />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:static inset-y-0 z-40 w-64 bg-sidebar border-r border-sidebar-border',
        'transform transition-transform duration-300 ease-in-out',
        isRTL ? 'right-0 lg:right-auto' : 'left-0 lg:left-auto',
        isOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'),
        'flex flex-col pt-16 lg:pt-0'
      )}>
        {/* Logo */}
        <div className="hidden lg:flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">GRP</span>
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground">Stiffness Test</h1>
            <p className="text-xs text-sidebar-foreground/60">ISO 9969</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                'nav-item',
                isActive && 'active'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Language Toggle */}
        <div className="hidden lg:block p-4 border-t border-sidebar-border">
          <button
            onClick={toggleLanguage}
            className="w-full nav-item justify-center"
          >
            <Languages className="w-5 h-5" />
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden pt-14 lg:pt-0">
        <div className="h-full overflow-y-auto scrollbar-thin p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
