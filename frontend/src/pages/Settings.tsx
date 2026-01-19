import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TouchButton } from '@/components/ui/TouchButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useWifiControl, useLanControl } from '@/hooks/useApi';
import {
  Languages, Moon, Sun, Monitor, Wifi, WifiOff, Network,
  RefreshCw, Signal, Lock, Globe, Check, Loader2
} from 'lucide-react';
import type { WifiNetwork } from '@/types/api';

const Settings = () => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  // WiFi state
  const {
    wifiStatus,
    networks,
    isScanning,
    scanNetworks,
    connectWifi,
    disconnectWifi
  } = useWifiControl();

  const [selectedNetwork, setSelectedNetwork] = useState<WifiNetwork | null>(null);
  const [wifiPassword, setWifiPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // LAN state
  const { lanStatus, configureLan } = useLanControl();
  const [lanMode, setLanMode] = useState<'static' | 'dhcp'>(lanStatus?.mode || 'dhcp');
  const [lanIp, setLanIp] = useState(lanStatus?.ip_address || '192.168.0.5');
  const [lanSubnet, setLanSubnet] = useState(lanStatus?.subnet_mask || '255.255.255.0');
  const [lanGateway, setLanGateway] = useState(lanStatus?.gateway || '');

  const handleScanWifi = () => {
    scanNetworks();
  };

  const handleSelectNetwork = (network: WifiNetwork) => {
    setSelectedNetwork(network);
    setWifiPassword('');
    setShowPasswordDialog(true);
  };

  const handleConnectWifi = () => {
    if (selectedNetwork && wifiPassword) {
      connectWifi.mutate({
        ssid: selectedNetwork.ssid,
        password: wifiPassword
      });
      setShowPasswordDialog(false);
      setWifiPassword('');
      setSelectedNetwork(null);
    }
  };

  const handleDisconnectWifi = () => {
    disconnectWifi.mutate();
  };

  const handleSaveLan = () => {
    if (lanMode === 'static') {
      configureLan.mutate({
        mode: 'static',
        ip_address: lanIp,
        subnet_mask: lanSubnet,
        gateway: lanGateway || undefined,
      });
    } else {
      configureLan.mutate({ mode: 'dhcp' });
    }
  };

  const getSignalIcon = (signal: number) => {
    if (signal >= 70) return <Signal className="w-4 h-4 text-green-500" />;
    if (signal >= 40) return <Signal className="w-4 h-4 text-yellow-500" />;
    return <Signal className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <div className="page-header">
        <h1 className="text-xl lg:text-2xl font-bold">{t('nav.settings')}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Language Card */}
        <Card className="industrial-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5" />
              Language / اللغة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TouchButton
              variant={language === 'en' ? 'primary' : 'outline'}
              onClick={() => setLanguage('en')}
              className="w-full"
            >
              English
            </TouchButton>
            <TouchButton
              variant={language === 'ar' ? 'primary' : 'outline'}
              onClick={() => setLanguage('ar')}
              className="w-full"
            >
              العربية
            </TouchButton>
          </CardContent>
        </Card>

        {/* Theme Card */}
        <Card className="industrial-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Theme / السمة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TouchButton
              variant={theme === 'dark' ? 'primary' : 'outline'}
              onClick={() => setTheme('dark')}
              className="w-full flex items-center justify-center gap-2"
            >
              <Moon className="w-5 h-5" />
              {language === 'ar' ? 'داكن' : 'Dark'}
            </TouchButton>
            <TouchButton
              variant={theme === 'light' ? 'primary' : 'outline'}
              onClick={() => setTheme('light')}
              className="w-full flex items-center justify-center gap-2"
            >
              <Sun className="w-5 h-5" />
              {language === 'ar' ? 'فاتح' : 'Light'}
            </TouchButton>
          </CardContent>
        </Card>

        {/* WiFi Card */}
        <Card className="industrial-card md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                {language === 'ar' ? 'إعدادات الواي فاي' : 'WiFi Settings'}
              </div>
              {wifiStatus?.connected && (
                <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500">
                  <Check className="w-3 h-3 mr-1" />
                  {wifiStatus.ssid}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Status */}
            {wifiStatus?.connected && (
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Wifi className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">{wifiStatus.ssid}</p>
                    <p className="text-sm text-muted-foreground">IP: {wifiStatus.ip_address}</p>
                  </div>
                </div>
                <TouchButton
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnectWifi}
                  disabled={disconnectWifi.isPending}
                >
                  <WifiOff className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'قطع' : 'Disconnect'}
                </TouchButton>
              </div>
            )}

            {/* Scan Button */}
            <TouchButton
              variant="outline"
              onClick={handleScanWifi}
              disabled={isScanning}
              className="w-full"
            >
              {isScanning ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5 mr-2" />
              )}
              {language === 'ar' ? 'البحث عن الشبكات' : 'Scan Networks'}
            </TouchButton>

            {/* Networks List */}
            {networks.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {networks.map((network) => (
                  <div
                    key={network.ssid}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
                      ${wifiStatus?.ssid === network.ssid
                        ? 'bg-primary/20 border border-primary'
                        : 'bg-secondary/30 hover:bg-secondary/50'
                      }`}
                    onClick={() => wifiStatus?.ssid !== network.ssid && handleSelectNetwork(network)}
                  >
                    <div className="flex items-center gap-3">
                      {getSignalIcon(network.signal)}
                      <div>
                        <p className="font-medium">{network.ssid}</p>
                        <p className="text-xs text-muted-foreground">
                          {network.signal}% - {network.security}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {network.security !== 'Open' && <Lock className="w-4 h-4 text-muted-foreground" />}
                      {wifiStatus?.ssid === network.ssid && (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* LAN Card */}
        <Card className="industrial-card md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                {language === 'ar' ? 'إعدادات الشبكة السلكية (LAN)' : 'LAN Settings (Ethernet)'}
              </div>
              {lanStatus?.connected && (
                <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500">
                  <Globe className="w-3 h-3 mr-1" />
                  {lanStatus.ip_address}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-3">
              <TouchButton
                variant={lanMode === 'dhcp' ? 'primary' : 'outline'}
                onClick={() => setLanMode('dhcp')}
                className="w-full"
              >
                {language === 'ar' ? 'تلقائي (DHCP)' : 'Automatic (DHCP)'}
              </TouchButton>
              <TouchButton
                variant={lanMode === 'static' ? 'primary' : 'outline'}
                onClick={() => setLanMode('static')}
                className="w-full"
              >
                {language === 'ar' ? 'ثابت (Static)' : 'Static IP'}
              </TouchButton>
            </div>

            {/* Static IP Fields */}
            {lanMode === 'static' && (
              <div className="grid gap-4 md:grid-cols-3 p-4 bg-secondary/30 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="lan-ip">
                    {language === 'ar' ? 'عنوان IP' : 'IP Address'}
                  </Label>
                  <Input
                    id="lan-ip"
                    value={lanIp}
                    onChange={(e) => setLanIp(e.target.value)}
                    placeholder="192.168.0.5"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lan-subnet">
                    {language === 'ar' ? 'قناع الشبكة' : 'Subnet Mask'}
                  </Label>
                  <Input
                    id="lan-subnet"
                    value={lanSubnet}
                    onChange={(e) => setLanSubnet(e.target.value)}
                    placeholder="255.255.255.0"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lan-gateway">
                    {language === 'ar' ? 'البوابة (اختياري)' : 'Gateway (optional)'}
                  </Label>
                  <Input
                    id="lan-gateway"
                    value={lanGateway}
                    onChange={(e) => setLanGateway(e.target.value)}
                    placeholder="192.168.0.1"
                    className="font-mono"
                  />
                </div>
              </div>
            )}

            {/* Current Status */}
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="text-sm">
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'الوضع الحالي:' : 'Current Mode:'}{' '}
                  <span className="font-medium text-foreground">
                    {lanStatus?.mode === 'static'
                      ? (language === 'ar' ? 'ثابت' : 'Static')
                      : (language === 'ar' ? 'تلقائي' : 'DHCP')
                    }
                  </span>
                </p>
                {lanStatus?.ip_address && (
                  <p className="text-muted-foreground">
                    IP: <span className="font-mono text-foreground">{lanStatus.ip_address}</span>
                  </p>
                )}
              </div>
              <TouchButton
                variant="success"
                size="sm"
                onClick={handleSaveLan}
                disabled={configureLan.isPending}
              >
                {configureLan.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {language === 'ar' ? 'حفظ' : 'Save'}
              </TouchButton>
            </div>
          </CardContent>
        </Card>

        {/* System Info Card */}
        <Card className="industrial-card md:col-span-2">
          <CardHeader>
            <CardTitle>System Info</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2 text-sm">
            <div className="flex justify-between p-2 bg-secondary/30 rounded">
              <span className="text-muted-foreground">Company</span>
              <span className="font-mono">MNT</span>
            </div>
            <div className="flex justify-between p-2 bg-secondary/30 rounded">
              <span className="text-muted-foreground">Developer</span>
              <span className="font-mono">Khalid Ibrahim Almuhaideb</span>
            </div>
            <div className="flex justify-between p-2 bg-secondary/30 rounded">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between p-2 bg-secondary/30 rounded">
              <span className="text-muted-foreground">Standard</span>
              <span className="font-mono">ISO 9969</span>
            </div>
            <div className="flex justify-between p-2 bg-secondary/30 rounded md:col-span-2">
              <span className="text-muted-foreground">Machine</span>
              <span className="font-mono">GRP Ring Stiffness Test Machine</span>
            </div>
          </CardContent>
        </Card>
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
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4 mr-2" />
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
