# GRP Stiffness Test Machine - Development Notes

## STRICT RULES (MUST FOLLOW)

### 1. ALL work happens on the industrial computer ONLY
- The project lives on the industrial computer (this machine: 10.154.96.251)
- ALL file edits, builds, and commands MUST be executed via SSH to this machine
- NEVER edit files locally on the Mac or any other machine then transfer them
- NEVER clone or copy the project to another machine

### 2. NO external browser access - Kiosk ONLY
- The user views the application ONLY through the Chromium kiosk on the physical screen of this industrial computer
- The kiosk opens http://localhost:8000 automatically on boot
- NEVER start a dev server (npm run dev, vite, serve, etc.) on a new port
- NEVER suggest opening the UI from another device via IP address (e.g. http://10.154.96.251:xxxx)
- NEVER use --host flags or expose ports for external access
- The ONLY way to see the application is through the kiosk on localhost:8000

### 3. Correct development workflow
- Edit source files directly on this machine (via SSH)
- Build the frontend, copy to backend/static, restart backend, hard refresh kiosk
- See the Deployment Workflow section below for exact commands

## Deployment Workflow (IMPORTANT)

After making any frontend changes, follow these steps exactly to deploy:

### Step 1. Build the frontend
    cd ~/grp-stiffness-test-machine/frontend
    npm run build

### Step 2. Copy built files to backend static directory
    cp -r ~/grp-stiffness-test-machine/frontend/dist/* ~/grp-stiffness-test-machine/backend/static/

### Step 3. Restart the backend service
    sudo systemctl restart grp-backend

### Step 4. Hard refresh the browser (CRITICAL)
    export DISPLAY=:0 XAUTHORITY=/tmp/serverauth.* && xdotool key ctrl+shift+r

WARNING: The Chromium kiosk browser aggressively caches frontend files.
A normal refresh (F5) or just restarting the backend service is NOT enough.
You MUST do a hard refresh (Ctrl+Shift+R) to clear the cache.
If the hard refresh does not work, clear the cache manually:

    rm -rf ~/snap/chromium/common/chromium/Default/Cache
    rm -rf ~/snap/chromium/common/chromium/Default/Code\ Cache
    sudo reboot

## Architecture Notes

- Kiosk browser opens http://localhost:8000 (backend serves static frontend)
- grp-backend.service runs uvicorn on port 8000, serves both API and static files
- grp-frontend.service runs serve -s dist on port 8080 (NOT used by kiosk)
- PLC force values are stored in Newtons in the database
- Report force unit (N/kN) is configurable in Settings page, stored in localStorage
