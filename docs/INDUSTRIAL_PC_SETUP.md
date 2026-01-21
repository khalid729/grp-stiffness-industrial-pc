# Industrial PC Setup Guide

## Date: 2026-01-19

## 1. Network Configuration

File: /etc/netplan/00-installer-config.yaml

- enp1s0: Static 192.168.0.10/24 (PLC Connection)
- enp2s0: DHCP (Internet/LAN)

Commands:
  sudo netplan apply

## 2. Kiosk Mode

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

## 3. Services

### Backend (Port 8000)
  sudo systemctl status grp-backend
  sudo systemctl restart grp-backend

### Frontend (Port 8080)
  sudo systemctl status grp-frontend
  sudo systemctl restart grp-frontend

## 4. Display
- Resolution: 3840x2160 (4K)
- Check: DISPLAY=:0 xrandr

## 5. Troubleshooting
- Restart X: sudo systemctl restart getty@tty1
- View logs: journalctl -u grp-backend -f
- Full reboot: sudo reboot


## 6. Plymouth Boot Splash (MNT Logo)

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

## 7. Portrait Display Configuration

### X11 Rotation
File: ~/.config/openbox/autostart
  xrandr --output HDMI-1 --rotate right

### Touch Calibration (if needed)
  xinput set-prop "touch_device" "Coordinate Transformation Matrix" 0 1 0 -1 0 1 0 0 1

## 8. System Config Files (Backup)

Backup location in project:
  system-config/
  ├── plymouth/mnt-logo/     # Boot splash theme
  ├── openbox/autostart      # Kiosk autostart script
  ├── systemd/autologin.conf # Auto-login configuration
  ├── .bash_profile          # Login script
  ├── .xinitrc               # X startup
  └── grub                   # GRUB config
