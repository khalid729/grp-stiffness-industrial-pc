# سجل التغييرات | Changelog

## 2026-01-19 - Industrial PC Deployment

### Network Configuration
- Configured enp1s0 as static IP (192.168.0.100) for PLC
- Configured enp2s0 as DHCP for general network
- Created netplan configuration

### Kiosk Mode Setup
- Installed: xorg, openbox, chromium-browser, unclutter
- Configured auto-login for user khalid
- Configured X auto-start via .bash_profile
- Created openbox autostart for Chromium kiosk
- Configured 4K display (3840x2160)

### Systemd Services
- Created grp-backend.service (port 8000)
- Created grp-frontend.service (port 8080)
- Enabled services for auto-start

### Snap7 Performance Optimization
- Added read_db_block() to connector.py
- Rewrote data_service.py with block reads
- Reduced WS_UPDATE_INTERVAL: 100ms -> 20ms
- Result: 27x faster PLC communication
- Result: 50 Hz update rate (was 2-3 Hz)

### Files Modified
- /etc/netplan/00-installer-config.yaml
- /etc/systemd/system/grp-backend.service
- /etc/systemd/system/grp-frontend.service
- /etc/systemd/system/getty@tty1.service.d/autologin.conf
- ~/.bash_profile
- ~/.xinitrc
- ~/.config/openbox/autostart
- ~/.config/openbox/rc.xml
- backend/plc/connector.py
- backend/plc/data_service.py
- backend/config.py
- frontend/src/lib/utils.ts (created)

### Files Backed Up
- backend/plc/data_service.py.backup

