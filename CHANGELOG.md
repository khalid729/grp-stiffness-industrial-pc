# سجل التغييرات | Changelog

## 2026-02-16 - Report Force Unit Options & Deployment Docs

### New Features
- Added Report Options section in Settings page with N/kN force unit toggle
- Force unit selection applies to: force_at_target, max_force, and ring_stiffness
- Force unit persisted in localStorage and passed to both frontend report dialog and backend PDF generator

### Files Modified
- frontend/src/pages/Settings.tsx - Added report options UI
- frontend/src/contexts/LanguageContext.tsx - Added AR/EN translations
- frontend/src/components/reports/TestReportDialog.tsx - Dynamic force unit display
- frontend/src/hooks/useApi.ts - Pass force_unit query param to PDF endpoint
- backend/api/routes/reports.py - Accept force_unit query parameter
- backend/services/pdf_generator.py - Convert force values based on unit selection

### Documentation
- Created CLAUDE.md with deployment workflow and browser cache warning


## 2026-01-19 - Industrial PC Deployment

### Network Configuration
- Configured enp1s0 as static IP (192.168.0.10) for PLC
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


## 2026-01-20 - UI Improvements & Network Fix

### Network Configuration Fix
- Fixed backend network.py to use netplan instead of nmcli
- Fixed run_command() to properly handle sudo + command path resolution
- Updated cmd_paths: netplan → /usr/sbin/netplan
- Fixed IP conflict: changed computer from 192.168.0.10 to 192.168.0.10 on PLC network
- Sudoers configuration updated for sudo-rs compatibility

### Theme Support
- Added light theme CSS variables in index.css
- Fixed industrial-card gradient for light mode (removed dark gradient)
- Theme toggle now works correctly in Settings page

### Header Layout Update
- Reorganized header to show information on separate lines:
  - Line 1: Page title
  - Line 2: PLC Status label + status badge
  - Line 3: Test Status label + status badge
- Added translation keys: plc.status, test.status

### Files Modified
- backend/api/routes/network.py (netplan support, path fixes)
- frontend/src/index.css (light theme, industrial-card fix)
- frontend/src/components/layout/PortraitLayout.tsx (header layout)
- frontend/src/contexts/LanguageContext.tsx (new translations)
- /etc/sudoers.d/khalid (corrected paths for sudo-rs)

