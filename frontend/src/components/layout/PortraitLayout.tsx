import { ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Settings2, 
  Bell, 
  History, 
  Settings,
  Languages,
  Power,
  RotateCcw,
  Gauge,
  Move,
  Target,
  Weight,
  Scale
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLiveData } from "@/hooks/useLiveData";
import { useTareControl, useModeControl } from "@/hooks/useApi";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { SafetyIndicators, MachineIndicatorsGroup } from "@/components/dashboard/SafetyIndicators";
import { ModeToggle } from "@/components/dashboard/ModeToggle";
import { TestStatusBadge } from "@/components/dashboard/TestStatusBadge";
import { EStopButton } from "@/components/ui/EStopButton";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const navItems = [
  { path: "/", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { path: "/test-setup", icon: Settings2, labelKey: "nav.testSetup" },
  { path: "/alarms", icon: Bell, labelKey: "nav.alarms" },
  { path: "/history", icon: History, labelKey: "nav.history" },
  { path: "/settings", icon: Settings, labelKey: "nav.settings" },
];

const getCurrentTabName = (pathname: string, t: (key: string) => string) => {
  const item = navItems.find(i => i.path === pathname);
  return item ? t(item.labelKey) : t("nav.dashboard");
};

interface PortraitLayoutProps {
  children: ReactNode;
}

export function PortraitLayout({ children }: PortraitLayoutProps) {
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const [showShutdownDialog, setShowShutdownDialog] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [isPowerLoading, setIsPowerLoading] = useState(false);
  
  const { liveData, isConnected } = useLiveData();
  const { setMode } = useModeControl();
  const { tareLoadCell, zeroPosition } = useTareControl();
  
  const safety = liveData.safety || {
    e_stop: liveData.e_stop_active || false,
    upper_limit: liveData.upper_limit || false,
    lower_limit: liveData.lower_limit || false,
    home: liveData.at_home || false,
    ok: true,
    motion_allowed: true,
  };
  
  const isTestRunning = liveData.test_status === 2;
  const isLocalMode = !liveData.remote_mode;
  const controlsDisabled = isLocalMode || !isConnected;
  const forceN = (liveData.actual_force || 0) * 1000;
  const weightKg = forceN / 9.81;

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };
  
  const handleModeChange = () => {
    setMode.mutate(!liveData.remote_mode);
  };

  const handleShutdown = async () => {
    setIsPowerLoading(true);
    try {
      await fetch(`${API_URL}/api/network/power/shutdown`, { method: "POST" });
    } catch (e) {
      console.error("Shutdown failed:", e);
    }
    setIsPowerLoading(false);
    setShowShutdownDialog(false);
  };

  const handleRestart = async () => {
    setIsPowerLoading(true);
    try {
      await fetch(`${API_URL}/api/network/power/restart`, { method: "POST" });
    } catch (e) {
      console.error("Restart failed:", e);
    }
    setIsPowerLoading(false);
    setShowRestartDialog(false);
  };

  return (
    <div className="portrait-container">
      {/* Fixed Header Section */}
      <header className="flex-shrink-0 flex flex-col gap-1.5 p-2 pt-4 border-b border-border bg-background">
        {/* Top Section: Page Info (3 rows) + Logo (center) + E-Stop Button */}
        <div className="flex items-stretch gap-3 relative">
          {/* Left: Page Title, PLC Status, Test Status */}
          <div className="flex-1 flex flex-col gap-1.5">
            {/* Row 1: Page Title */}
            <h1 className="text-3xl font-bold">{getCurrentTabName(location.pathname, t)}</h1>
            
            {/* Row 2: PLC Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('plc.status')}:</span>
              <span className={cn(
                "px-3 py-1 rounded text-sm font-medium",
                liveData.plc?.connected ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
              )}>
                {liveData.plc?.connected ? t('plc.run') : t('plc.stop')}
              </span>
            </div>
            
            {/* Row 3: Test Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('test.status')}:</span>
              <TestStatusBadge status={liveData.test_status as 0 | 1 | 2 | 3 | 4 | 5 | -1} />
            </div>
          </div>
          
          {/* Center: Logo */}
          <img
            src="/logo.png"
            alt="MNT Logo"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-24 object-contain"
          />

          {/* Right: E-Stop Button - spans all 3 rows */}
          <EStopButton
            isActive={safety.e_stop}
            label={t('actions.eStop')}
            activeLabel={t('estop.active')}
            className="w-32 h-32 flex-shrink-0 self-center"
          />
        </div>

        {/* Row 4: Safety + Machine Indicators | Mode Toggle */}
        <div className="flex items-center gap-2">
          {/* Indicators */}
          <div className="flex flex-col gap-1">
            <SafetyIndicators
              eStop={safety.e_stop}
              upperLimit={safety.upper_limit}
              lowerLimit={safety.lower_limit}
              home={safety.home}
              safetyOk={safety.ok}
              motionAllowed={safety.motion_allowed}
            />
            <MachineIndicatorsGroup
              servoReady={liveData.servo_ready}
              servoEnabled={liveData.servo_enabled}
              servoError={liveData.servo_error}
              atHome={liveData.at_home}
              upperLock={liveData.lock_upper}
              lowerLock={liveData.lock_lower}
            />
          </div>
          
          {/* Mode Toggle - centered in remaining space */}
          <div className="flex-1 flex items-center justify-center">
            <ModeToggle
              isRemote={liveData.remote_mode}
              onChange={handleModeChange}
              disabled={isTestRunning}
            />
          </div>
        </div>

        {/* Row 3: Force, Weight, Position, Deflection */}
        <div className="grid grid-cols-4 gap-1.5">
          <StatusCard
            title={t('dashboard.force')}
            value={forceN.toFixed(0)}
            unit="N"
            icon={<Gauge className="w-4 h-4" />}
            variant="info"
            compact
            actionButton={
              <TouchButton
                variant="outline"
                size="sm"
                onClick={() => tareLoadCell.mutate()}
                disabled={controlsDisabled || isTestRunning}
                className="px-3 py-2 text-sm h-9"
              >
                <Scale className="w-5 h-5" />
              </TouchButton>
            }
          />
          <StatusCard
            title={t('dashboard.weight')}
            value={weightKg.toFixed(1)}
            unit="kg"
            icon={<Weight className="w-4 h-4" />}
            variant="info"
            compact
          />
          <StatusCard
            title={t('dashboard.position')}
            value={liveData.actual_position.toFixed(2)}
            unit="mm"
            icon={<Target className="w-4 h-4" />}
            compact
            actionButton={
              <TouchButton
                variant="outline"
                size="sm"
                onClick={() => zeroPosition.mutate()}
                disabled={controlsDisabled || isTestRunning}
                className="px-3 py-2 text-sm h-9"
              >
                <RotateCcw className="w-5 h-5" />
              </TouchButton>
            }
          />
          <StatusCard
            title={t('dashboard.deflection')}
            value={liveData.actual_deflection.toFixed(2)}
            unit="mm"
            icon={<Move className="w-4 h-4" />}
            variant="warning"
            compact
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content p-2 pb-24">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border py-4 px-3 bg-background z-50">
        <div className="flex items-center gap-1">
          {/* Navigation Tabs */}
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn("nav-tab flex-1", isActive && "active")}
              >
                <item.icon className="w-6 h-6" />
                <span className="hidden sm:inline">{t(item.labelKey)}</span>
              </NavLink>
            );
          })}

          {/* Divider */}
          <div className="w-px h-12 bg-border mx-1" />

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="nav-tab px-3"
            title={language === "en" ? "العربية" : "English"}
          >
            <Languages className="w-6 h-6" />
          </button>

          {/* Power Controls */}
          <button
            onClick={() => setShowRestartDialog(true)}
            className="nav-tab px-3 text-warning hover:text-warning"
            title="Restart"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          <button
            onClick={() => setShowShutdownDialog(true)}
            className="nav-tab px-3 text-destructive hover:text-destructive"
            title="Shutdown"
          >
            <Power className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Shutdown Dialog */}
      <AlertDialog open={showShutdownDialog} onOpenChange={setShowShutdownDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Power className="w-5 h-5" />
              {language === "ar" ? "إيقاف تشغيل النظام" : "Shutdown System"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ar"
                ? "هل أنت متأكد من إيقاف تشغيل النظام؟"
                : "Are you sure you want to shutdown the system?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPowerLoading}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleShutdown(); }}
              disabled={isPowerLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isPowerLoading && <RotateCcw className="w-4 h-4 mr-2 animate-spin" />}
              {language === "ar" ? "إيقاف" : "Shutdown"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restart Dialog */}
      <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-warning">
              <RotateCcw className="w-5 h-5" />
              {language === "ar" ? "إعادة تشغيل النظام" : "Restart System"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ar"
                ? "هل أنت متأكد من إعادة تشغيل النظام؟"
                : "Are you sure you want to restart the system?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPowerLoading}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleRestart(); }}
              disabled={isPowerLoading}
              className="bg-warning hover:bg-warning/90 text-warning-foreground"
            >
              {isPowerLoading && <RotateCcw className="w-4 h-4 mr-2 animate-spin" />}
              {language === "ar" ? "إعادة التشغيل" : "Restart"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}