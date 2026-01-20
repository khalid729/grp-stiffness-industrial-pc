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

