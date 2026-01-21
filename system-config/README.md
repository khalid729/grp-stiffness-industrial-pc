# System Configuration for Industrial PC

## Setup Instructions

### 1. Install Required Packages
```bash
sudo apt-get update
sudo apt-get install -y plymouth plymouth-themes openbox xinit chromium-browser unclutter feh imagemagick
```

### 2. Setup Plymouth Boot Splash
```bash
sudo cp -r plymouth/mnt-logo /usr/share/plymouth/themes/
sudo update-alternatives --install /usr/share/plymouth/themes/default.plymouth default.plymouth /usr/share/plymouth/themes/mnt-logo/mnt-logo.plymouth 100
sudo update-alternatives --set default.plymouth /usr/share/plymouth/themes/mnt-logo/mnt-logo.plymouth
sudo update-initramfs -u
```

### 3. Setup GRUB
```bash
sudo cp grub /etc/default/grub
sudo update-grub
```

### 4. Setup Auto-login
```bash
sudo mkdir -p /etc/systemd/system/getty@tty1.service.d
sudo cp systemd/autologin.conf /etc/systemd/system/getty@tty1.service.d/
sudo systemctl daemon-reload
```

### 5. Setup User Config
```bash
cp .bash_profile ~/
cp .xinitrc ~/
mkdir -p ~/.config/openbox
cp openbox/autostart ~/.config/openbox/
touch ~/.hushlogin
```

### 6. Reboot
```bash
sudo reboot
```

## Files Description
- `plymouth/mnt-logo/` - Boot splash theme with MNT logo
- `openbox/autostart` - Autostart script for kiosk mode
- `.bash_profile` - Auto-start X on login
- `.xinitrc` - X session configuration
- `systemd/autologin.conf` - Auto-login configuration
- `grub` - GRUB configuration for quiet boot
