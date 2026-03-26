# سجل التغييرات | Changelog

## 2026-03-26 - Multi-Position Testing (ISO 9969)

### New Features
- **Multi-position test groups**: Test same sample at 3 angular positions (0°, 40°, 80°) per ISO 9969
- Test Setup: Option to choose 1 or 3 positions (default: 3)
- Dashboard: Position indicator showing current position and angle
- Dashboard: Accept/Retry dialog after each position completes
- Dashboard: Next angle prompt dialog between positions
- History: Group badge showing position number and angle for grouped tests
- History: Click on grouped test opens combined group report
- **Combined Group Report** (4 pages when printed):
  - Page 1: Summary with results table for all positions + average ring stiffness + overall PASS/FAIL
  - Pages 2-4: Individual position reports with force-deflection charts

### Database Changes
- New `test_groups` table: stores shared sample info, multi-position config, average results
- Added `group_id`, `position`, `angle` columns to `tests` table
- Updated SN_CLASSES to include SN 1250 and SN 12500

### New API Endpoints
- `GET /api/groups` — List test groups with pagination
- `GET /api/groups/active` — Get current active group state
- `GET /api/groups/{id}` — Get group details with all position tests
- `POST /api/groups/{id}/retry/{position}` — Retry a specific position
- `POST /api/groups/reset` — Reset/cancel active group

### Files Added
- frontend/src/components/reports/GroupReportDialog.tsx — Combined group report component

### Files Modified
- backend/db/models.py — TestGroup model, group fields on Test model
- backend/api/websocket.py — Group state management, auto-create/link groups on test save
- backend/api/routes/reports.py — Group API endpoints
- backend/api/routes/status.py — num_positions/angles in test metadata
- frontend/src/pages/TestSetup.tsx — 1/3 positions toggle
- frontend/src/pages/Dashboard.tsx — Position indicator, accept/retry dialog, angle prompt, group report
- frontend/src/pages/History.tsx — Group badge, group report link
- frontend/src/hooks/useApi.ts — num_positions/angles in TestMetadata
- frontend/src/contexts/LanguageContext.tsx — Position/group translations (EN/AR)

---

## 2026-03-26 - Printer Settings, Report Improvements & Chart Fix

### New Features
- Added **Printer Management** section in Settings page
  - Discover network printers via CUPS/DNS-SD
  - Add/remove printers, set default, print test page
  - Shows configured printers with status badges
- Installed and configured CUPS on industrial PC for printer support

### Bug Fixes
- Fixed report Force-Deflection chart Y-axis starting from negative values — now starts from 0

### Changes
- Removed Max Force, Duration, and Data Points from report Results section (kept: Ring Stiffness, Force at Target, SN Class)
- Reduced inner text sizes in report by ~25% (text-sm → text-xs) for better A4 fit
- Reduced section padding and spacing in report for compact layout
- Added print CSS (@media print) for proper A4 page sizing

### New API Endpoints
- `GET /api/printer/list` — List configured printers and status
- `GET /api/printer/discover` — Discover network printers
- `POST /api/printer/add` — Add a printer
- `POST /api/printer/remove` — Remove a printer
- `POST /api/printer/set-default` — Set default printer
- `POST /api/printer/test-page` — Print test page

### Files Modified
- backend/api/routes/printer.py — New printer management API
- backend/main.py — Registered printer router
- frontend/src/hooks/useApi.ts — Added usePrinterControl hook
- frontend/src/pages/Settings.tsx — Added Printer section with discover/add/remove UI
- frontend/src/components/reports/TestReportDialog.tsx — Removed extra results, reduced text sizes, fixed chart Y-axis domain
- frontend/src/index.css — Added @media print styles for A4
- frontend/src/contexts/LanguageContext.tsx — Added printer translations (EN/AR)

---

## 2026-03-26 - Test Setup Improvements & Cursor Fix

### Bug Fixes
- Fixed mouse cursor toggle in Settings not working — removed `-nocursor` flag from `startx` in `.bash_profile` so cursor visibility is fully controlled by `unclutter` (start/stop)
- Fixed Max Force display showing raw Newtons as kN (e.g. 50000 kN instead of 50 kN) — added N→kN conversion in frontend display and kN→N conversion when sending to PLC

### Changes
- Added SN 12500 to Target SN Class dropdown (was: 1250/2500/5000/10000)
- Max Force default raised from 50 kN to **200 kN** (load cell maximum) — slider range 10–200 kN
- Max Stroke default raised from 100 mm to **300 mm** — slider range 50–300 mm
- Pipe Diameter max raised from 1000 mm to **2000 mm**
- Pipe Diameter slider step changed from 10 mm to **50 mm** (50, 100, 150, ..., 2000)
- Updated STIFFNESS_CLASS_OPTIONS to include SN12500

### Files Modified
- ~/.bash_profile — Removed `-nocursor` from startx command
- frontend/src/pages/TestSetup.tsx — SN 12500 option, max_force N/kN conversion, pipe diameter max & step, default values
- backend/plc/data_service.py — Updated default max_force (200000 N) and max_stroke (300 mm)

---

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
