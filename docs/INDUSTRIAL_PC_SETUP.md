# Industrial PC Setup Guide

## Date: 2026-01-19 (last updated: 2026-05-06)

## 1. Network Configuration

File: `/etc/netplan/00-installer-config.yaml`

- **enp1s0**: Static **192.168.0.10/24** (PLC connection — MANDATORY, see warning below)
- **enp2s0**: DHCP (Internet/LAN)
- **wlp3s0**: WiFi DHCP (managed by NetworkManager)

```bash
sudo netplan apply
```

### ⚠️  PLC subnet has NO DHCP server
The PLC at `192.168.0.100` is on an isolated `/24` with no DHCP. If `enp1s0` is set to `dhcp4: true`, it will boot with no IPv4 address and the backend will log endless `TCP : Unreachable peer` errors. Always assign a static address on `192.168.0.0/24`.

Quick check:
```bash
ip -4 addr show enp1s0          # must show 192.168.0.x
ping -c 3 192.168.0.100         # must succeed
```

If `enp1s0` has no address but the cable is plugged in, the netplan was likely reverted. Temporary recovery:
```bash
sudo ip addr add 192.168.0.10/24 dev enp1s0
```

## 2. Remote Access (Tailscale)

Installed 2026-05-06 to give stable SSH/HTTP access regardless of which WiFi network the machine is on.

```bash
# install
curl -fsSL https://tailscale.com/install.sh | sudo sh

# register (interactive — opens auth URL)
sudo tailscale up --hostname=stiffness-machine

# verify
tailscale status
tailscale ip -4
```

- **Tailnet hostname:** `stiffness-machine`
- **Tailscale IP:** `100.104.47.81`
- **SSH from anywhere:** `ssh khalid@100.104.47.81`

## 3. Kiosk Mode

### Installed Packages
  sudo apt install xorg openbox chromium-browser unclutter

### Auto-Login
File: /etc/systemd/system/getty@tty1.service.d/autologin.conf

### X Auto-Start
File: ~/.bash_profile

### Openbox Config
Files:
  - ~/.xinitrc
  - ~/.config/openbox/autostart
  - ~/.config/openbox/rc.xml

## 4. Services

### Backend (Port 8000)
  sudo systemctl status grp-backend
  sudo systemctl restart grp-backend

### Frontend (Port 8080)
  sudo systemctl status grp-frontend
  sudo systemctl restart grp-frontend

## 5. Display
- Resolution: 3840x2160 (4K)
- Check: DISPLAY=:0 xrandr

## 6. Troubleshooting
- Restart X: sudo systemctl restart getty@tty1
- View logs: journalctl -u grp-backend -f
- Full reboot: sudo reboot


## 7. Plymouth Boot Splash (MNT Logo)

### Theme Location
  /usr/share/plymouth/themes/mnt-logo/

### Theme Files
  - mnt-logo.plymouth (theme config)
  - mnt-logo.script (script file)
  - logo.png (rotated 90° for boot - portrait mode)
  - logo-x.png (rotated -90° for X session display)

### Enable Theme
  sudo plymouth-set-default-theme mnt-logo
  sudo update-initramfs -u

### GRUB Configuration
File: /etc/default/grub
  GRUB_CMDLINE_LINUX_DEFAULT="quiet splash loglevel=0 vt.global_cursor_default=0"

After editing:
  sudo update-grub

## 8. Portrait Display Configuration

### X11 Rotation
File: ~/.config/openbox/autostart
  xrandr --output HDMI-1 --rotate right

### Touch Calibration (if needed)
  xinput set-prop "touch_device" "Coordinate Transformation Matrix" 0 1 0 -1 0 1 0 0 1

## 9. System Config Files (Backup)

Backup location in project:
  system-config/
  ├── plymouth/mnt-logo/     # Boot splash theme
  ├── openbox/autostart      # Kiosk autostart script
  ├── systemd/autologin.conf # Auto-login configuration
  ├── .bash_profile          # Login script
  ├── .xinitrc               # X startup
  └── grub                   # GRUB config
