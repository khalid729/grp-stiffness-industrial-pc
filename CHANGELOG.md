# سجل التغييرات | Changelog

## 2026-02-18 - Dashboard Controls & Jog Speed Improvements

### Changes
- Jog speed selector now works in both LOCAL and REMOTE modes (only requires PLC connection)
- Tare (force zero) button now works in both LOCAL and REMOTE modes
- Position Reset button now works in both LOCAL and REMOTE modes
- Jog speed display now syncs from PLC on startup (reads actual servo.jog_velocity instead of hardcoded 50)
- Maximum jog speed limited to 400 mm/min (was 6000) in both frontend and backend

### Files Modified
- frontend/src/pages/Dashboard.tsx - Jog speed button: changed disabled condition from controlsDisabled to !isConnected
- frontend/src/components/layout/PortraitLayout.tsx - Tare & Position Reset: changed disabled from controlsDisabled to !isConnected
- frontend/src/hooks/useLiveData.ts - useJogControl: added PLC jog_velocity sync on startup, clamped speed to 1-400
- backend/plc/command_service.py - set_jog_velocity: changed max limit from 6000 to 400 mm/min

---

## 2026-02-18 - Target SN Class Parameter

### New Features
- Added Target SN Class parameter to Test Setup page (dropdown: SN 1250 / 2500 / 5000 / 10000)
- Value is written to PLC DB1 offset 58 (Int, 2 bytes) and read back on page load
- Stiffness Class field in Product Info section now auto-syncs with selected Target SN Class (read-only)
- PLC uses this value for pass/fail determination during test

### Files Modified
- backend/plc/data_service.py - Added PARAM_TARGET_SN_CLASS = 58 (DB1, Int), read/write in get_parameters()/set_parameters()
- backend/api/routes/status.py - Added target_sn_class: Optional[int] in ParametersRequest
- frontend/src/hooks/useApi.ts - Added target_sn_class in TestParameters interface
- frontend/src/types/api.ts - Added target_sn_class in TestParameters interface
- frontend/src/pages/TestSetup.tsx - Added Target SN Class dropdown, synced metadata stiffness_class
- frontend/src/contexts/LanguageContext.tsx - Added translation "testSetup.targetSnClass" (EN/AR)

---

## 2026-02-16 - Excel Reports, USB Export & Format Choice

### New Features
- Individual test Excel reports with force unit support (N/kN)
- PDF/Excel format picker dropdown in History page per-test download
- Reports & USB Export page accessible from Settings
  - USB auto-detection via lsblk with auto-mount
  - Multi-select tests with Select All toggle
  - Format toggle (PDF/Excel)
  - Export to USB button (USB-only, no browser download)
  - USB eject button for safe removal
  - USB free space indicator
- Bulk ZIP download endpoint for multiple reports

### Bug Fixes
- Fixed USB mount permissions (uid/gid/umask) so backend can write to VFAT drives
- Fixed Excel reports showing raw N values when kN unit selected
- Removed browser download from Reports Export page (USB-only)

### New API Endpoints
- `GET /api/report/excel/{test_id}` - Single test Excel report with force_unit
- `GET /api/usb/devices` - Detect USB drives with auto-mount
- `POST /api/usb/export` - Export reports to USB drive
- `POST /api/usb/eject` - Safely unmount USB drive
- `POST /api/report/bulk-download` - Download multiple reports as ZIP

### Files Modified
- backend/api/routes/reports.py - Added Excel, USB, bulk-download endpoints
- backend/services/excel_export.py - Added force_unit parameter to all methods
- frontend/src/pages/History.tsx - Added PDF/Excel dropdown menu
- frontend/src/pages/ReportsExport.tsx - New USB export page
- frontend/src/pages/Settings.tsx - Added Reports & USB Export button
- frontend/src/hooks/useApi.ts - Added downloadExcel, useUsbDevices, useUsbExport hooks
- frontend/src/contexts/LanguageContext.tsx - Added export translations (EN/AR)
- frontend/src/App.tsx - Added /reports-export route


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
