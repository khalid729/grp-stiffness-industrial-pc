# 📖 Stiffness Test Machine - Kiosk Setup Documentation

## 🎯 نظرة عامة
هذا المستند يوثق إعداد نظام Kiosk احترافي على Raspberry Pi لتشغيل واجهة جهاز اختبار الصلابة (Stiffness Test Machine).

---

## 📋 معلومات النظام

| المكون | التفاصيل |
|--------|----------|
| الجهاز | Raspberry Pi |
| نظام التشغيل | Debian GNU/Linux 13 (trixie) |
| دقة الشاشة | 1920x1080 |
| Window Manager | labwc (Wayland) |
| Display Manager | greetd |
| المستخدم | khalid |

---

## 🏗️ بنية المشروع

```
~/grp-stiffness-test-machine/
├── backend/                 # FastAPI Backend
│   ├── venv/               # Python Virtual Environment
│   ├── main.py             # نقطة الدخول
│   ├── plc/                # اتصال PLC
│   ├── api/                # API endpoints
│   ├── db/                 # قاعدة البيانات
│   └── requirements.txt    # متطلبات Python
├── frontend/               # React Frontend
│   ├── src/                # كود المصدر
│   ├── dist/               # ملفات الإنتاج (بعد البناء)
│   └── package.json        # متطلبات Node.js
└── docs/                   # التوثيق
```

---

## 🔧 الخدمات (Systemd Services)

### 1. Backend Service
**الملف:** `/etc/systemd/system/stiffness-backend.service`

```ini
[Unit]
Description=Stiffness Test Machine Backend
After=network.target

[Service]
Type=simple
User=khalid
WorkingDirectory=/home/khalid/grp-stiffness-test-machine/backend
Environment=PATH=/home/khalid/grp-stiffness-test-machine/backend/venv/bin
ExecStart=/home/khalid/grp-stiffness-test-machine/backend/venv/bin/uvicorn main:socket_app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### 2. Frontend Service
**الملف:** `/etc/systemd/system/stiffness-frontend.service`

```ini
[Unit]
Description=Stiffness Test Machine Frontend
After=network.target

[Service]
Type=simple
User=khalid
WorkingDirectory=/home/khalid/grp-stiffness-test-machine/frontend
ExecStart=/usr/bin/serve -s dist -l 3000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

---

## 🖥️ إعداد Kiosk Mode

### greetd (Auto Login)
**الملف:** `/etc/greetd/config.toml`

```toml
[terminal]
vt = 7

[default_session]
command = labwc
user = khalid
```

### Kiosk Script
**الملف:** `~/kiosk.sh`

```bash
#!/bin/bash

# Show splash (matching Plymouth size)
swaybg -i /home/khalid/splash.png -m fill -c '#ffffff' &
SWAYBG_PID=$!

# Wait for services to be ready
until systemctl is-active --quiet stiffness-backend && systemctl is-active --quiet stiffness-frontend; do
    sleep 1
done

# Extra wait for frontend to fully load
sleep 3

# Kill background
kill $SWAYBG_PID 2>/dev/null

# Start Chromium in kiosk mode
chromium --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --disable-restore-session-state --no-first-run --start-fullscreen http://localhost:3000
```

### labwc Autostart
**الملف:** `~/.config/labwc/autostart`

```bash
# Disable screen blanking
wlr-randr --output HDMI-A-1 --on 2>/dev/null &

# Start kiosk mode
/home/khalid/kiosk.sh &
```

---

## 🎨 Boot Splash Screen (Plymouth)

### Theme Location
`/usr/share/plymouth/themes/mnt-logo/`

### Theme Files
- `logo.png` - الشعار الأصلي (3003x3769)
- `mnt-logo.plymouth` - إعدادات الثيم
- `mnt-logo.script` - سكربت العرض

### Plymouth Config
**الملف:** `/usr/share/plymouth/themes/mnt-logo/mnt-logo.plymouth`

```ini
[Plymouth Theme]
Name=MNT Logo
Description=MNT Boot Splash
ModuleName=script

[script]
ImageDir=/usr/share/plymouth/themes/mnt-logo
ScriptFile=/usr/share/plymouth/themes/mnt-logo/mnt-logo.script
```

### Plymouth Script
**الملف:** `/usr/share/plymouth/themes/mnt-logo/mnt-logo.script`

```c
# Set background color (white)
Window.SetBackgroundTopColor(1, 1, 1);
Window.SetBackgroundBottomColor(1, 1, 1);

# Load and display logo
logo.image = Image(logo.png);

# Scale logo to fit nicely (50% of screen height)
screen_width = Window.GetWidth();
screen_height = Window.GetHeight();

logo_width = logo.image.GetWidth();
logo_height = logo.image.GetHeight();

# Calculate scale to make logo 50% of screen height
scale = (screen_height * 0.5) / logo_height;

scaled_width = logo_width * scale;
scaled_height = logo_height * scale;

logo.scaled = logo.image.Scale(scaled_width, scaled_height);

# Create sprite and center it
logo.sprite = Sprite(logo.scaled);
logo.sprite.SetX(screen_width / 2 - scaled_width / 2);
logo.sprite.SetY(screen_height / 2 - scaled_height / 2);
logo.sprite.SetOpacity(1);
```

### Plymouth Delay
**الملف:** `/etc/systemd/system/plymouth-quit.service.d/delay.conf`

```ini
[Service]
ExecStartPre=/bin/sleep 8
```

---

## ⚙️ Boot Configuration

### Kernel Command Line
**الملف:** `/boot/firmware/cmdline.txt`

```
console=serial0,115200 console=tty1 root=PARTUUID=a105f872-02 rootfstype=ext4 fsck.repair=yes rootwait cfg80211.ieee80211_regdom=SA quiet splash plymouth.ignore-serial-consoles logo.nologo vt.global_cursor_default=0
```

### Config.txt Additions
**الملف:** `/boot/firmware/config.txt`

```ini
disable_splash=1
```

---

## 📁 الملفات المهمة

| الملف | الوصف |
|-------|-------|
| `~/logo.png` | الشعار الأصلي |
| `~/splash.png` | شعار معدل الحجم للـ labwc (1920x1080) |
| `~/kiosk.sh` | سكربت تشغيل Kiosk |
| `~/commands.txt` | أوامر مرجعية سريعة |
| `~/.config/labwc/autostart` | سكربت بدء labwc |

---

## 🔌 المنافذ

| الخدمة | المنفذ |
|--------|--------|
| Backend API | http://localhost:8000 |
| Frontend | http://localhost:3000 |

---

## 📝 أوامر مفيدة

### إدارة الخدمات
```bash
# عرض حالة الخدمات
sudo systemctl status stiffness-backend stiffness-frontend greetd

# إعادة تشغيل الخدمات
sudo systemctl restart stiffness-backend stiffness-frontend

# إيقاف Kiosk للصيانة
sudo systemctl stop greetd

# تشغيل Kiosk
sudo systemctl start greetd
```

### عرض السجلات
```bash
# Backend logs
sudo journalctl -u stiffness-backend -f

# Frontend logs
sudo journalctl -u stiffness-frontend -f

# Boot logs
sudo journalctl -b
```

### تحديث المشروع
```bash
# تحديث الكود
cd ~/grp-stiffness-test-machine
git pull

# إعادة بناء Frontend
cd frontend
npm run build

# إعادة تشغيل الخدمات
sudo systemctl restart stiffness-backend stiffness-frontend
```

### إعادة إنشاء splash.png
```bash
convert ~/logo.png -resize x540 -background white -gravity center -extent 1920x1080 ~/splash.png
```

### تحديث Plymouth
```bash
sudo update-initramfs -u
```

---

## 🔄 تسلسل الإقلاع

```
1. [Power On]
      ↓
2. [Plymouth Splash] ─── شعار MNT على خلفية بيضاء (8+ ثواني)
      ↓
3. [greetd] ─── تسجيل دخول تلقائي للمستخدم khalid
      ↓
4. [labwc] ─── بدء Wayland compositor
      ↓
5. [swaybg] ─── عرض الشعار كخلفية (انتقال سلس)
      ↓
6. [Wait] ─── انتظار جاهزية Backend و Frontend
      ↓
7. [Chromium Kiosk] ─── فتح الواجهة في وضع ملء الشاشة
```

---

## 🛠️ استكشاف الأخطاء

### الخدمات لا تعمل
```bash
# فحص حالة الخدمة
sudo systemctl status stiffness-backend

# عرض الأخطاء
sudo journalctl -u stiffness-backend -n 50
```

### Plymouth لا يظهر
```bash
# التأكد من الثيم
sudo plymouth-set-default-theme

# تحديث initramfs
sudo update-initramfs -u
```

### Chromium لا يفتح
```bash
# فحص greetd
sudo systemctl status greetd

# إعادة تشغيل greetd
sudo systemctl restart greetd
```

---

## 📦 الحزم المثبتة

```
- greetd (Display Manager)
- labwc (Wayland Compositor)
- plymouth & plymouth-themes (Boot Splash)
- chromium (Web Browser)
- serve (Static File Server)
- swaybg (Wallpaper)
- imagemagick (Image Processing)
```

---

## 🔐 الأمان

- الجهاز يعمل في وضع Kiosk (لا يمكن الخروج من المتصفح)
- الوصول عبر SSH متاح للصيانة: `ssh khalid@192.168.68.82`
- لا يوجد كلمة مرور لتسجيل الدخول المحلي (autologin)

---

## 📅 معلومات الإعداد

- **تاريخ الإعداد:** 2026-01-06
- **آخر تحديث:** 2026-01-06

---

## 👨‍💻 المطور

تم الإعداد بمساعدة Claude Code

