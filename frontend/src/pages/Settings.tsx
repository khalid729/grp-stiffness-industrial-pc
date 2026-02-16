import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { TouchButton } from "@/components/ui/TouchButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { IPKeypad } from "@/components/ui/IPKeypad";
import { VirtualKeyboard } from "@/components/ui/VirtualKeyboard";
import { useWifiControl, useLanControl, useLan2Control, useCursorControl } from "@/hooks/useApi";
import {
  Languages, Moon, Sun, Wifi, WifiOff, Network,
  RefreshCw, Lock, Globe, Check, Loader2, Cpu, Settings as SettingsIcon, Signal,
  MousePointer, EyeOff, FileText, HardDrive
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WifiNetwork {
  ssid: string;
  signal: number;
  security: boolean;
}

const Settings = () => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // WiFi
  const { wifiStatus, networks, isScanning, scanNetworks, connectWifi, disconnectWifi } = useWifiControl();
  const [selectedNetwork, setSelectedNetwork] = useState<WifiNetwork | null>(null);
  const [wifiPassword, setWifiPassword] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);

  // LAN (enp2s0 = PLC Network)
  const { lanStatus, configureLan } = useLanControl();
  const [lanMode, setLanMode] = useState<"static" | "dhcp">(lanStatus?.mode || "dhcp");
  const [lanIp, setLanIp] = useState(lanStatus?.ip_address || "192.168.0.5");
  const [lanSubnet, setLanSubnet] = useState(lanStatus?.subnet_mask || "255.255.255.0");
  const [lanGateway, setLanGateway] = useState(lanStatus?.gateway || "");

  // LAN2 (enp1s0 = General Network)
  const { lan2Status, configureLan2 } = useLan2Control();
  const [lan2Mode, setLan2Mode] = useState<"static" | "dhcp">(lan2Status?.mode || "static");
  const [lan2Ip, setLan2Ip] = useState(lan2Status?.ip_address || "192.168.0.100");
  const [lan2Subnet, setLan2Subnet] = useState(lan2Status?.subnet_mask || "255.255.255.0");
  const [lan2Gateway, setLan2Gateway] = useState(lan2Status?.gateway || "");

  // Cursor
  const { cursorHidden, toggleCursor } = useCursorControl();

  // Report Settings
  const [forceUnit, setForceUnit] = useState<"N" | "kN">(() => {
    return (localStorage.getItem("report_force_unit") as "N" | "kN") || "N";
  });

  const handleForceUnitChange = (unit: "N" | "kN") => {
    setForceUnit(unit);
    localStorage.setItem("report_force_unit", unit);
  };

  // IP Keypad state
  const [ipKeypadOpen, setIpKeypadOpen] = useState<string | null>(null);

  const handleSelectNetwork = (network: WifiNetwork) => {
    setSelectedNetwork(network);
    setWifiPassword("");
    setShowPasswordDialog(true);
    setShowKeyboard(true);
  };

  const handleConnectWifi = () => {
    if (selectedNetwork && wifiPassword) {
      connectWifi.mutate({ ssid: selectedNetwork.ssid, password: wifiPassword });
      setShowPasswordDialog(false);
      setWifiPassword("");
      setSelectedNetwork(null);
      setShowKeyboard(false);
    }
  };

  const handleSaveLan = () => {
    if (lanMode === "static") {
      configureLan.mutate({ mode: "static", ip_address: lanIp, subnet_mask: lanSubnet, gateway: lanGateway });
    } else {
      configureLan.mutate({ mode: "dhcp" });
    }
  };

  const handleSaveLan2 = () => {
    if (lan2Mode === "static") {
      configureLan2.mutate({ mode: "static", ip_address: lan2Ip, subnet_mask: lan2Subnet, gateway: lan2Gateway });
    } else {
      configureLan2.mutate({ mode: "dhcp" });
    }
  };

  const getSignalIcon = (signal: number) => {
    if (signal >= 70) return <Signal className="w-5 h-5 text-success" />;
    if (signal >= 40) return <Signal className="w-5 h-5 text-warning" />;
    return <Signal className="w-5 h-5 text-destructive" />;
  };

  const handleThemeChange = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);
  };

  const handleIpConfirm = (value: string) => {
    switch (ipKeypadOpen) {
      case "lanIp": setLanIp(value); break;
      case "lanSubnet": setLanSubnet(value); break;
      case "lanGateway": setLanGateway(value); break;
      case "lan2Ip": setLan2Ip(value); break;
      case "lan2Subnet": setLan2Subnet(value); break;
      case "lan2Gateway": setLan2Gateway(value); break;
    }
    setIpKeypadOpen(null);
  };

  const getIpValue = () => {
    switch (ipKeypadOpen) {
      case "lanIp": return lanIp;
      case "lanSubnet": return lanSubnet;
      case "lanGateway": return lanGateway;
      case "lan2Ip": return lan2Ip;
      case "lan2Subnet": return lan2Subnet;
      case "lan2Gateway": return lan2Gateway;
      default: return "";
    }
  };

  return (
    <div className="flex flex-col h-full gap-2 animate-slide-up overflow-hidden pb-16">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SettingsIcon className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">{t("nav.settings")}</h1>
      </div>

      {/* Content Grid */}
      <div className="flex-1 grid grid-cols-2 gap-2 overflow-hidden">
        {/* Language */}
        <div className="industrial-card p-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Languages className="w-6 h-6" />
            {t("settings.language")}
          </div>
          <div className="flex gap-2">
            <TouchButton
              variant={language === "en" ? "primary" : "outline"}
              size="sm"
              onClick={() => setLanguage("en")}
              className="flex-1 min-h-[52px]"
            >
              English
            </TouchButton>
            <TouchButton
              variant={language === "ar" ? "primary" : "outline"}
              size="sm"
              onClick={() => setLanguage("ar")}
              className="flex-1 min-h-[52px]"
            >
              العربية
            </TouchButton>
          </div>
        </div>

        {/* Theme */}
        <div className="industrial-card p-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-base font-semibold">
            {theme === "dark" ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
            {t("settings.theme")}
          </div>
          <div className="flex gap-2">
            <TouchButton
              variant={theme === "dark" ? "primary" : "outline"}
              size="sm"
              onClick={() => handleThemeChange("dark")}
              className="flex-1 min-h-[52px] flex items-center justify-center gap-1"
            >
              <Moon className="w-5 h-5" />
              {t("settings.dark")}
            </TouchButton>
            <TouchButton
              variant={theme === "light" ? "primary" : "outline"}
              size="sm"
              onClick={() => handleThemeChange("light")}
              className="flex-1 min-h-[52px] flex items-center justify-center gap-1"
            >
              <Sun className="w-5 h-5" />
              {t("settings.light")}
            </TouchButton>
          </div>
        </div>

        {/* WiFi - Full width */}
        <div className="industrial-card p-2 flex flex-col gap-2 col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-semibold">
              <Wifi className="w-6 h-6" />
              {t("settings.wifi")}
            </div>
            <div className="flex items-center gap-2">
              {wifiStatus?.connected && (
                <>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                    {wifiStatus.ssid}
                  </Badge>
                  {wifiStatus.ip_address && (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/30 font-mono">
                      {wifiStatus.ip_address}
                    </Badge>
                  )}
                </>
              )}
              <TouchButton
                variant="outline"
                size="sm"
                onClick={() => scanNetworks()}
                disabled={isScanning}
                className="h-10"
              >
                <RefreshCw className={cn("w-5 h-5", isScanning && "animate-spin")} />
              </TouchButton>
            </div>
          </div>
          {networks && networks.length > 0 && (
            <div className="grid grid-cols-4 gap-1 max-h-24 overflow-y-auto">
              {networks.map((network: WifiNetwork) => (
                <div
                  key={network.ssid}
                  className="flex items-center justify-between p-2 bg-secondary/30 rounded text-sm hover:bg-secondary/50 cursor-pointer"
                  onClick={() => handleSelectNetwork(network)}
                >
                  <span className="flex items-center gap-1">
                    {getSignalIcon(network.signal)}
                    {network.ssid}
                    {network.security && <Lock className="w-2.5 h-2.5" />}
                  </span>
                  <Badge variant="outline" className="text-sm px-1 py-0">
                    {network.signal}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PLC Network (enp2s0) */}
        <div className="industrial-card p-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Cpu className="w-6 h-6 text-warning" />
            {t("settings.plcNetworkLabel")} (enp2s0)
          </div>
          <div className="flex gap-1">
            <TouchButton
              variant={lanMode === "dhcp" ? "primary" : "outline"}
              size="sm"
              onClick={() => setLanMode("dhcp")}
              className="flex-1 text-sm min-h-[52px]"
            >
              <Globe className="w-5 h-5 mr-1" />
              DHCP
            </TouchButton>
            <TouchButton
              variant={lanMode === "static" ? "primary" : "outline"}
              size="sm"
              onClick={() => setLanMode("static")}
              className="flex-1 text-sm min-h-[52px]"
            >
              <Network className="w-5 h-5 mr-1" />
              Static
            </TouchButton>
          </div>
          {lanMode === "static" && (
            <div className="space-y-1.5">
              <div>
                <Label className="text-sm">{t("settings.ipAddress")}</Label>
                <Input
                  value={lanIp}
                  readOnly
                  onClick={() => setIpKeypadOpen("lanIp")}
                  className="h-12 text-lg font-mono cursor-pointer"
                />
              </div>
              <div>
                <Label className="text-sm">{t("settings.subnet")}</Label>
                <Input
                  value={lanSubnet}
                  readOnly
                  onClick={() => setIpKeypadOpen("lanSubnet")}
                  className="h-12 text-lg font-mono cursor-pointer"
                />
              </div>
              <div>
                <Label className="text-sm">{t("settings.gateway")}</Label>
                <Input
                  value={lanGateway}
                  readOnly
                  onClick={() => setIpKeypadOpen("lanGateway")}
                  className="h-12 text-lg font-mono cursor-pointer"
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between p-1.5 bg-warning/10 border border-warning/20 rounded text-sm">
            <div>
              <span className="text-muted-foreground">{t("settings.modeLabel")} </span>
              <span className="font-medium">{lanMode === "static" ? "Static" : "DHCP"}</span>
              {lanStatus?.ip_address && (
                <span className="ml-2 font-mono">{lanStatus.ip_address}</span>
              )}
              {lanStatus?.connected && (
                <Badge variant="outline" className="ml-2 bg-success/10 text-success border-success/30 text-xs px-1 py-0">UP</Badge>
              )}
            </div>
          </div>
          <TouchButton variant="success" size="sm" onClick={handleSaveLan} isLoading={configureLan.isPending} className="min-h-[52px]">
            <Check className="w-5 h-5 mr-1" />
            {t("settings.save")}
          </TouchButton>
        </div>

        {/* General Network (enp1s0) */}
        <div className="industrial-card p-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Network className="w-6 h-6" />
            {t("settings.generalNetworkLabel")} (enp1s0)
          </div>
          <div className="flex gap-1">
            <TouchButton
              variant={lan2Mode === "dhcp" ? "primary" : "outline"}
              size="sm"
              onClick={() => setLan2Mode("dhcp")}
              className="flex-1 text-sm min-h-[52px]"
            >
              DHCP
            </TouchButton>
            <TouchButton
              variant={lan2Mode === "static" ? "primary" : "outline"}
              size="sm"
              onClick={() => setLan2Mode("static")}
              className="flex-1 text-sm min-h-[52px]"
            >
              Static
            </TouchButton>
          </div>
          {lan2Mode === "static" && (
            <div className="space-y-1.5">
              <div>
                <Label className="text-sm">{t("settings.ipAddress")}</Label>
                <Input
                  value={lan2Ip}
                  readOnly
                  onClick={() => setIpKeypadOpen("lan2Ip")}
                  className="h-12 text-lg font-mono cursor-pointer"
                />
              </div>
              <div>
                <Label className="text-sm">{t("settings.subnet")}</Label>
                <Input
                  value={lan2Subnet}
                  readOnly
                  onClick={() => setIpKeypadOpen("lan2Subnet")}
                  className="h-12 text-lg font-mono cursor-pointer"
                />
              </div>
              <div>
                <Label className="text-sm">{t("settings.gateway")}</Label>
                <Input
                  value={lan2Gateway}
                  readOnly
                  onClick={() => setIpKeypadOpen("lan2Gateway")}
                  className="h-12 text-lg font-mono cursor-pointer"
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between p-1.5 bg-secondary/50 rounded text-sm">
            <div>
              <span className="text-muted-foreground">{t("settings.modeLabel")} </span>
              <span className="font-medium">{lan2Mode === "static" ? "Static" : "DHCP"}</span>
              {lan2Status?.ip_address && (
                <span className="ml-2 font-mono">{lan2Status.ip_address}</span>
              )}
              {lan2Status?.connected && (
                <Badge variant="outline" className="ml-2 bg-success/10 text-success border-success/30 text-xs px-1 py-0">UP</Badge>
              )}
            </div>
          </div>
          <TouchButton variant="success" size="sm" onClick={handleSaveLan2} isLoading={configureLan2.isPending} className="min-h-[52px]">
            <Check className="w-5 h-5 mr-1" />
            {t("settings.save")}
          </TouchButton>
        </div>
      </div>

      {/* Report Options */}
      <div className="industrial-card p-2 flex flex-col gap-2 col-span-2">
          <div className="flex items-center gap-2 text-base font-semibold">
            <FileText className="w-6 h-6 text-primary" />
            {t("settings.reportOptions")}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("settings.forceUnit")}</span>
            <div className="flex gap-2">
              <TouchButton
                variant={forceUnit === "N" ? "primary" : "outline"}
                size="sm"
                onClick={() => handleForceUnitChange("N")}
                className="min-h-[44px] min-w-[80px]"
              >
                N
              </TouchButton>
              <TouchButton
                variant={forceUnit === "kN" ? "primary" : "outline"}
                size="sm"
                onClick={() => handleForceUnitChange("kN")}
                className="min-h-[44px] min-w-[80px]"
              >
                kN
              </TouchButton>
            </div>
          </div>
          <TouchButton
            variant="outline"
            size="sm"
            onClick={() => navigate("/reports-export")}
            className="min-h-[48px] w-full"
          >
            <HardDrive className="w-5 h-5 mr-2" />
            {t("settings.reportsUsbExport")}
          </TouchButton>
        </div>

      {/* System Info */}
      <div className="industrial-card p-2">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex justify-between p-1.5 bg-secondary/30 rounded">
            <span className="text-muted-foreground">Company</span>
            <span className="font-mono">MNT</span>
          </div>
          <div className="flex justify-between p-1.5 bg-secondary/30 rounded">
            <span className="text-muted-foreground">Developer</span>
            <span className="font-mono">Khalid I. Almuhaideb</span>
          </div>
          <div className="flex justify-between p-1.5 bg-secondary/30 rounded">
            <span className="text-muted-foreground">Version</span>
            <span className="font-mono">1.0.0</span>
          </div>
          <div className="flex justify-between p-1.5 bg-secondary/30 rounded">
            <span className="text-muted-foreground">Standard</span>
            <span className="font-mono">ISO 9969</span>
          </div>
          <div className="flex justify-between p-1.5 bg-secondary/30 rounded">
            <span className="text-muted-foreground">Machine</span>
            <span className="font-mono">GRP Ring Stiffness</span>
          </div>
          <TouchButton
            variant={cursorHidden ? "outline" : "primary"}
            size="sm"
            onClick={() => toggleCursor.mutate()}
            disabled={toggleCursor.isPending}
            className="flex items-center justify-center gap-1.5 min-h-0 h-auto p-1.5"
          >
            {cursorHidden ? (
              <><EyeOff className="w-4 h-4" /> {t("settings.mouseCursor")}: {t("settings.cursorHidden")}</>
            ) : (
              <><MousePointer className="w-4 h-4" /> {t("settings.mouseCursor")}: {t("settings.cursorVisible")}</>
            )}
          </TouchButton>
        </div>
      </div>

      {/* WiFi Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={(open) => { setShowPasswordDialog(open); if (!open) setShowKeyboard(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              {t("settings.connectTo")} {selectedNetwork?.ssid}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="wifi-password">
                {t("settings.password")}
              </Label>
              <Input
                id="wifi-password"
                type="text"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                className="h-14 text-xl font-mono"
                placeholder={t("settings.enterPassword")}
              />
            </div>
            {showKeyboard && (
              <VirtualKeyboard
                value={wifiPassword}
                onChange={setWifiPassword}
                onClose={() => setShowKeyboard(false)}
              />
            )}
          </div>
          <DialogFooter className="gap-2">
            <TouchButton
              variant="outline"
              onClick={() => { setShowPasswordDialog(false); setShowKeyboard(false); }}
              className="min-h-[48px]"
            >
              {t("settings.cancel")}
            </TouchButton>
            <TouchButton
              variant="primary"
              onClick={handleConnectWifi}
              disabled={!wifiPassword || connectWifi.isPending}
              className="min-h-[48px]"
            >
              {connectWifi.isPending ? (
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
              ) : (
                <Wifi className="w-6 h-6 mr-2" />
              )}
              {t("settings.connect")}
            </TouchButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IP Keypad */}
      <IPKeypad
        isOpen={ipKeypadOpen !== null}
        onClose={() => setIpKeypadOpen(null)}
        onConfirm={handleIpConfirm}
        initialValue={getIpValue()}
        label={t("settings.enterAddress")}
      />
    </div>
  );
};

export default Settings;
