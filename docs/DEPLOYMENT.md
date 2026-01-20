# GRP Stiffness Test Machine - Industrial PC Deployment Guide

## نظرة عامة | Overview

تم نشر هذا المشروع على كمبيوتر صناعي يعمل بنظام Ubuntu 25.10 Server ليكون واجهة HMI للـ PLC.

This project is deployed on an Industrial PC running Ubuntu 25.10 Server as an HMI interface for the PLC.

---

## معلومات النظام | System Information

| Item | Value |
|------|-------|
| **OS** | Ubuntu 25.10 (Questing Quokka) |
| **Hostname** | stiffnesstest |
| **User** | khalid |
| **PLC** | Siemens S7-1200 |
| **Protocol** | Snap7 (S7 Protocol) |

---

## إعدادات الشبكة | Network Configuration

### واجهات الشبكة | Network Interfaces

| Interface | Type | Configuration | Purpose |
|-----------|------|---------------|---------|
| **enp1s0** | Ethernet | Static: 192.168.0.100/24 | PLC Connection |
| **enp2s0** | Ethernet | DHCP | Internet/LAN |
| **wlp3s0** | WiFi | Disabled | Not used |

### مخطط الشبكة | Network Diagram



### ملف إعدادات Netplan

Location: `/etc/netplan/00-installer-config.yaml`



---

## الخدمات | Services

### Backend Service



### Frontend Service



### أوامر إدارة الخدمات | Service Management



---

## المنافذ | Ports

| Port | Service | Description |
|------|---------|-------------|
| 8000 | Backend | FastAPI + WebSocket |
| 8080 | Frontend | React App (Static) |
| 102 | PLC | Snap7 S7 Protocol |

---

## الوصول | Access

### SSH Access
Welcome to Ubuntu 25.10 (GNU/Linux 6.17.0-5-generic x86_64)

 * Documentation:  https://docs.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Mon Jan 19 22:01:55 UTC 2026

  System load:             0.74
  Usage of /:              4.4% of 232.64GB
  Memory usage:            8%
  Swap usage:              0%
  Temperature:             48.0 C
  Processes:               154
  Users logged in:         0
  IPv4 address for enp2s0: 192.168.68.72
  IPv6 address for enp2s0: fd34:ada0:9d56:d009:8810:1eff:fe34:fb3c

 * Due to a now-resolved bug in the date command, this system may be unable
   to automatically check for updates. Manually install the update using:

     sudo apt install --update rust-coreutils

   https://discourse.ubuntu.com/t/enabling-updates-on-ubuntu-25-10-systems/

91 updates can be applied immediately.
53 of these updates are standard security updates.
To see these additional updates run: apt list --upgradable

### Web Interface
- Frontend: http://192.168.68.72:8080
- Backend API: http://192.168.68.72:8000

---

## Date
**Deployed:** 2026-01-19
