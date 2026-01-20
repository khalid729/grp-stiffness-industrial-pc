import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { TouchButton } from '@/components/ui/TouchButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useWifiControl, useLanControl, useLan2Control } from '@/hooks/useApi';
import {
  Languages, Moon, Sun, Wifi, WifiOff, Network,
  RefreshCw, Lock, Globe, Check, Loader2, Cpu, Settings as SettingsIcon, Signal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WifiNetwork {
  ssid: string;
  signal: number;
  security: boolean;
}

const Settings = () => {
  const { t, language, setLanguage } = useLanguage();
  
  // Theme state (simple local state for now)
  const { theme, setTheme } = useTheme();

  // WiFi
  const { wifiStatus, networks, isScanning, scanNetworks, connectWifi, disconnectWifi } = useWifiControl();
  const [selectedNetwork, setSelectedNetwork] = useState<WifiNetwork | null>(null);
  const [wifiPassword, setWifiPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // LAN
  const { lanStatus, configureLan } = useLanControl();
  const [lanMode, setLanMode] = useState<'static' | 'dhcp'>(lanStatus?.mode || 'dhcp');
  const [lanIp, setLanIp] = useState(lanStatus?.ip_address || '192.168.0.5');
  const [lanSubnet, setLanSubnet] = useState(lanStatus?.subnet_mask || '255.255.255.0');
  const [lanGateway, setLanGateway] = useState(lanStatus?.gateway || '');

  // LAN2 (PLC)
  const { lan2Status, configureLan2 } = useLan2Control();
  const [lan2Mode, setLan2Mode] = useState<'static' | 'dhcp'>(lan2Status?.mode || 'static');
  const [lan2Ip, setLan2Ip] = useState(lan2Status?.ip_address || '192.168.0.100');
  const [lan2Subnet, setLan2Subnet] = useState(lan2Status?.subnet_mask || '255.255.255.0');
  const [lan2Gateway, setLan2Gateway] = useState(lan2Status?.gateway || '');

  const handleSelectNetwork = (network: WifiNetwork) => {
    setSelectedNetwork(network);
    setWifiPassword('');
    setShowPasswordDialog(true);
  };

  const handleConnectWifi = () => {
    if (selectedNetwork && wifiPassword) {
      // WiFi connection logic would go here
      setShowPasswordDialog(false);
      setWifiPassword('');
      setSelectedNetwork(null);
    }
  };

  const handleSaveLan = () => {
    if (lanMode === 'static') {
      configureLan.mutate({ mode: 'static', ip_address: lanIp, subnet_mask: lanSubnet, gateway: lanGateway });
    } else {
      configureLan.mutate({ mode: 'dhcp' });
    }
  };

  const handleSaveLan2 = () => {
    if (lan2Mode === 'static') {
      configureLan2.mutate({ mode: 'static', ip_address: lan2Ip, subnet_mask: lan2Subnet, gateway: lan2Gateway });
    } else {
      configureLan2.mutate({ mode: 'dhcp' });
    }
  };

  const getSignalIcon = (signal: number) => {
    if (signal >= 70) return <Signal className="w-5 h-5 text-success" />;
    if (signal >= 40) return <Signal className="w-5 h-5 text-warning" />;
    return <Signal className="w-5 h-5 text-destructive" />;
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
  };

  return (
    <div className="flex flex-col h-full gap-2 animate-slide-up overflow-hidden pb-16">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SettingsIcon className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>
      </div>

      {/* Content Grid */}
      <div className="flex-1 grid grid-cols-2 gap-2 overflow-hidden">
        {/* Language */}
        <div className="industrial-card p-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Languages className="w-6 h-6" />
            Language / اللغة
          </div>
          <div className="flex gap-2">
            <TouchButton
              variant={language === 'en' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setLanguage('en')}
              className="flex-1"
            >
              English
            </TouchButton>
            <TouchButton
              variant={language === 'ar' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setLanguage('ar')}
              className="flex-1"
            >
              العربية
            </TouchButton>
          </div>
        </div>

        {/* Theme */}
        <div className="industrial-card p-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Moon className="w-6 h-6" />
            Theme / السمة
          </div>
          <div className="flex gap-2">
            <TouchButton
              variant={theme === 'dark' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleThemeChange('dark')}
              className="flex-1 flex items-center justify-center gap-1"
            >
              <Moon className="w-5 h-5" />
              {language === 'ar' ? 'داكن' : 'Dark'}
            </TouchButton>
            <TouchButton
              variant={theme === 'light' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleThemeChange('light')}
              className="flex-1 flex items-center justify-center gap-1"
            >
              <Sun className="w-5 h-5" />
              {language === 'ar' ? 'فاتح' : 'Light'}
            </TouchButton>
          </div>
        </div>

        {/* WiFi - Full width */}
        <div className="industrial-card p-2 flex flex-col gap-2 col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-semibold">
              {wifiStatus?.connected ? <Wifi className="w-6 h-6 text-success" /> : <WifiOff className="w-6 h-6" />}
              {language === 'ar' ? 'الواي فاي' : 'WiFi'}
            </div>
            <TouchButton variant="ghost" size="sm" onClick={scanNetworks} disabled={isScanning}>
              {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            </TouchButton>
          </div>
          
          {/* Current Connection */}
          {wifiStatus?.connected && (
            <div className="flex items-center justify-between p-2 bg-success/10 border border-success/20 rounded text-base">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-success" />
                <div>
                  <span className="font-medium">{wifiStatus.ssid}</span>
                  <span className="text-muted-foreground ml-2">{wifiStatus.ip_address}</span>
                </div>
              </div>
              <TouchButton variant="destructive" size="sm" onClick={() => disconnectWifi.mutate()}>
                {language === 'ar' ? 'قطع' : 'Disconnect'}
              </TouchButton>
            </div>
          )}
          
          {/* Available Networks */}
          {networks.length > 0 && (
            <div className="space-y-1 max-h-20 overflow-y-auto scrollbar-thin">
              {networks.map((network, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-1.5 hover:bg-secondary/50 rounded text-base cursor-pointer"
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

        {/* LAN */}
        <div className="industrial-card p-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Network className="w-6 h-6" />
            {language === 'ar' ? 'الشبكة المحلية' : 'LAN'} (enp2s0)
          </div>
          <div className="flex gap-1">
            <TouchButton
              variant={lanMode === 'dhcp' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setLanMode('dhcp')}
              className="flex-1 text-sm"
            >
              <Globe className="w-5 h-5 mr-1" />
              DHCP
            </TouchButton>
            <TouchButton
              variant={lanMode === 'static' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setLanMode('static')}
              className="flex-1 text-sm"
            >
              <Network className="w-5 h-5 mr-1" />
              Static
            </TouchButton>
          </div>
          {lanMode === 'static' && (
            <div className="space-y-1.5">
              <div>
                <Label className="text-sm">{language === 'ar' ? 'عنوان IP' : 'IP Address'}</Label>
                <Input value={lanIp} onChange={(e) => setLanIp(e.target.value)} className="h-10 text-base font-mono" />
              </div>
              <div>
                <Label className="text-sm">{language === 'ar' ? 'قناع الشبكة' : 'Subnet'}</Label>
                <Input value={lanSubnet} onChange={(e) => setLanSubnet(e.target.value)} className="h-10 text-base font-mono" />
              </div>
              <div>
                <Label className="text-sm">{language === 'ar' ? 'البوابة' : 'Gateway'}</Label>
                <Input value={lanGateway} onChange={(e) => setLanGateway(e.target.value)} className="h-10 text-base font-mono" />
              </div>
            </div>
          )}
          {/* Current Status */}
          <div className="flex items-center justify-between p-1.5 bg-secondary/50 rounded text-sm">
            <div>
              <span className="text-muted-foreground">{language === 'ar' ? 'الوضع:' : 'Mode:'} </span>
              <span className="font-medium">{lanMode === 'static' ? 'Static' : 'DHCP'}</span>
              {lanStatus?.ip_address && (
                <span className="ml-2 font-mono">{lanStatus.ip_address}</span>
              )}
            </div>
          </div>
          <TouchButton variant="success" size="sm" onClick={handleSaveLan} isLoading={configureLan.isPending}>
            <Check className="w-5 h-5 mr-1" />
            {language === 'ar' ? 'حفظ' : 'Save'}
          </TouchButton>
        </div>

        {/* PLC Network */}
        <div className="industrial-card p-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Cpu className="w-6 h-6 text-warning" />
            {language === 'ar' ? 'شبكة PLC' : 'PLC Network'} (enp1s0)
          </div>
          <div className="flex gap-1">
            <TouchButton
              variant={lan2Mode === 'dhcp' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setLan2Mode('dhcp')}
              className="flex-1 text-sm"
            >
              DHCP
            </TouchButton>
            <TouchButton
              variant={lan2Mode === 'static' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setLan2Mode('static')}
              className="flex-1 text-sm"
            >
              Static
            </TouchButton>
          </div>
          {lan2Mode === 'static' && (
            <div className="space-y-1.5">
              <div>
                <Label className="text-sm">{language === 'ar' ? 'عنوان IP' : 'IP Address'}</Label>
                <Input value={lan2Ip} onChange={(e) => setLan2Ip(e.target.value)} className="h-10 text-base font-mono" />
              </div>
              <div>
                <Label className="text-sm">{language === 'ar' ? 'قناع الشبكة' : 'Subnet'}</Label>
                <Input value={lan2Subnet} onChange={(e) => setLan2Subnet(e.target.value)} className="h-10 text-base font-mono" />
              </div>
              <div>
                <Label className="text-sm">{language === 'ar' ? 'البوابة' : 'Gateway'}</Label>
                <Input value={lan2Gateway} onChange={(e) => setLan2Gateway(e.target.value)} className="h-10 text-base font-mono" />
              </div>
            </div>
          )}
          {/* Current Status */}
          <div className="flex items-center justify-between p-1.5 bg-warning/10 border border-warning/20 rounded text-sm">
            <div>
              <span className="text-muted-foreground">{language === 'ar' ? 'الوضع:' : 'Mode:'} </span>
              <span className="font-medium">{lan2Mode === 'static' ? 'Static' : 'DHCP'}</span>
              {lan2Status?.ip_address && (
                <span className="ml-2 font-mono">{lan2Status.ip_address}</span>
              )}
            </div>
          </div>
          <TouchButton variant="success" size="sm" onClick={handleSaveLan2} isLoading={configureLan2.isPending}>
            <Check className="w-5 h-5 mr-1" />
            {language === 'ar' ? 'حفظ' : 'Save'}
          </TouchButton>
        </div>
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
          <div className="flex justify-between p-1.5 bg-secondary/30 rounded col-span-2">
            <span className="text-muted-foreground">Machine</span>
            <span className="font-mono">GRP Ring Stiffness Test Machine</span>
          </div>
        </div>
      </div>

      {/* WiFi Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              {language === 'ar' ? 'الاتصال بـ' : 'Connect to'} {selectedNetwork?.ssid}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="wifi-password">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </Label>
              <Input
                id="wifi-password"
                type="password"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
                onKeyDown={(e) => e.key === 'Enter' && handleConnectWifi()}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <TouchButton
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </TouchButton>
            <TouchButton
              variant="primary"
              onClick={handleConnectWifi}
              disabled={!wifiPassword || connectWifi.isPending}
            >
              {connectWifi.isPending ? (
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
              ) : (
                <Wifi className="w-6 h-6 mr-2" />
              )}
              {language === 'ar' ? 'اتصال' : 'Connect'}
            </TouchButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;