import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "ar";

interface Translations {
  [key: string]: { en: string; ar: string };
}

const translations: Translations = {
  // Navigation
  "nav.dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
  "nav.testSetup": { en: "Test Setup", ar: "إعداد الاختبار" },
  "nav.alarms": { en: "Alarms", ar: "التنبيهات" },
  "nav.history": { en: "History", ar: "السجل" },
  "nav.settings": { en: "Settings", ar: "الإعدادات" },

  // Dashboard
  "dashboard.force": { en: "Force", ar: "القوة" },
  "dashboard.weight": { en: "Weight", ar: "الوزن" },
  "dashboard.deflection": { en: "Deflection", ar: "الانحراف" },
  "dashboard.position": { en: "Position", ar: "الموضع" },
  "dashboard.status": { en: "Status", ar: "الحالة" },
  "dashboard.machineIndicators": { en: "Machine Status", ar: "حالة الآلة" },
  "dashboard.servoReady": { en: "Ready", ar: "جاهز" },
  "dashboard.servoEnabled": { en: "Enabled", ar: "مفعل" },
  "dashboard.servoError": { en: "Error", ar: "خطأ" },
  "dashboard.atHome": { en: "Home", ar: "الموضع" },
  "dashboard.upperLock": { en: "Upper", ar: "علوي" },
  "dashboard.lowerLock": { en: "Lower", ar: "سفلي" },

  // Indicators
  "indicators.safety": { en: "Safety Status", ar: "حالة السلامة" },
  "indicators.machine": { en: "Machine Status", ar: "حالة الآلة" },

  // Actions
  "actions.home": { en: "HOME", ar: "الرجوع" },
  "actions.start": { en: "START", ar: "بدء" },
  "actions.stop": { en: "STOP", ar: "إيقاف" },
  "actions.tare": { en: "TARE", ar: "تصفير" },
  "actions.zero": { en: "ZERO", ar: "صفر" },
  "actions.eStop": { en: "E-STOP", ar: "طوارئ" },

  // Manual Control
  "manual.jogUp": { en: "JOG UP", ar: "تحريك لأعلى" },
  "manual.jogDown": { en: "JOG DOWN", ar: "تحريك لأسفل" },
  "manual.stepUp": { en: "STEP UP", ar: "خطوة لأعلى" },
  "manual.stepDown": { en: "STEP DOWN", ar: "خطوة لأسفل" },
  "manual.stepDistance": { en: "Step Distance", ar: "مسافة الخطوة" },
  "manual.speed": { en: "Speed", ar: "السرعة" },
  "manual.enable": { en: "ENABLE", ar: "تشغيل" },
  "manual.disable": { en: "DISABLE", ar: "إيقاف" },
  "manual.resetAlarm": { en: "RESET", ar: "إعادة ضبط" },
  "manual.lockUpper": { en: "LOCK UP", ar: "قفل علوي" },
  "manual.lockLower": { en: "LOCK DN", ar: "قفل سفلي" },
  "manual.unlockAll": { en: "UNLOCK", ar: "فتح الكل" },

  // Mode
  "mode.local": { en: "LOCAL", ar: "محلي" },
  "mode.remote": { en: "REMOTE", ar: "بعيد" },

  // Status
  "status.idle": { en: "Idle", ar: "جاهز" },
  "status.starting": { en: "Starting", ar: "بدء التشغيل" },
  "status.testing": { en: "Testing", ar: "جاري الاختبار" },
  "status.atTarget": { en: "At Target", ar: "في الهدف" },
  "status.returning": { en: "Returning", ar: "عودة" },
  "status.complete": { en: "Complete", ar: "مكتمل" },
  "status.error": { en: "Error", ar: "خطأ" },

  // Connection
  "connection.connected": { en: "Connected", ar: "متصل" },
  "connection.disconnected": { en: "Disconnected", ar: "غير متصل" },

  // Test Setup
  "testSetup.saved": { en: "Settings saved", ar: "تم الحفظ" },
  "testSetup.reset": { en: "Settings reset", ar: "تم إعادة الضبط" },
  "testSetup.saveBtn": { en: "Save", ar: "حفظ" },
  "testSetup.resetBtn": { en: "Reset", ar: "إعادة" },
  "testSetup.targetDeflection": { en: "Target Deflection", ar: "الانحراف المستهدف" },
  "testSetup.pipeParams": { en: "Pipe Parameters", ar: "معاملات الأنبوب" },
  "testSetup.testParams": { en: "Test Parameters", ar: "معاملات الاختبار" },
  "testSetup.pipeDiameter": { en: "Pipe Diameter", ar: "قطر الأنبوب" },
  "testSetup.pipeLength": { en: "Pipe Length", ar: "طول الأنبوب" },
  "testSetup.deflectionPercent": { en: "Deflection %", ar: "نسبة الانحراف" },
  "testSetup.testSpeed": { en: "Test Speed", ar: "سرعة الاختبار" },
  "testSetup.maxStroke": { en: "Max Stroke", ar: "أقصى شوط" },
  "testSetup.maxForce": { en: "Max Force", ar: "أقصى قوة" },
  "testSetup.isoNote": { en: "Parameters according to ISO 9969 standard", ar: "المعاملات وفقاً لمعيار ISO 9969" },

  // Test Setup - Product Information
  "testSetup.productInfo": { en: "Product Information", ar: "معلومات المنتج" },
  "testSetup.lotNumber": { en: "Lot Number", ar: "رقم الدفعة" },
  "testSetup.nominalDiameter": { en: "Nominal Diameter", ar: "القطر الاسمي" },
  "testSetup.pressureClass": { en: "Pressure Class", ar: "فئة الضغط" },
  "testSetup.stiffnessClass": { en: "Stiffness Class", ar: "فئة الصلابة" },
  "testSetup.productId": { en: "Product ID", ar: "معرف المنتج" },
  "testSetup.thickness": { en: "Thickness", ar: "السُمك" },
  "testSetup.nominalWeight": { en: "Nominal Weight (kg/m)", ar: "الوزن الاسمي (كجم/م)" },

  // Test Setup - Project Information
  "testSetup.projectInfo": { en: "Project Information", ar: "معلومات المشروع" },
  "testSetup.projectName": { en: "Project Name", ar: "اسم المشروع" },
  "testSetup.customerName": { en: "Customer Name", ar: "اسم العميل" },
  "testSetup.poNumber": { en: "PO Number", ar: "رقم أمر الشراء" },

  // Alarms
  "alarms.active": { en: "Active", ar: "نشطة" },
  "alarms.acknowledged": { en: "Acknowledged", ar: "تم الإقرار" },
  "alarms.ackAll": { en: "Ack All", ar: "إقرار الكل" },
  "alarms.refresh": { en: "Refresh", ar: "تحديث" },
  "alarms.noAlarms": { en: "No alarms", ar: "لا توجد تنبيهات" },
  "alarms.acked": { en: "Acked", ar: "تم الإقرار" },
  "alarms.filter.all": { en: "All", ar: "الكل" },
  "alarms.filter.active": { en: "Active", ar: "نشطة" },
  "alarms.filter.acknowledged": { en: "Acknowledged", ar: "مقرة" },

  // E-Stop
  "estop.active": { en: "ACTIVE", ar: "نشط" },
  "estop.activeTitle": { en: "Emergency Stop Active", ar: "إيقاف الطوارئ نشط" },
  "estop.activeDescription": { en: "Release the emergency stop button to continue", ar: "حرر زر الطوارئ للمتابعة" },

  // PLC
  "plc.connected": { en: "PLC Connected", ar: "PLC متصل" },
  "plc.disconnected": { en: "PLC Disconnected", ar: "PLC غير متصل" },
  "plc.run": { en: "RUN", ar: "تشغيل" },
  "plc.stop": { en: "STOP", ar: "توقف" },
  "plc.status": { en: "PLC Status", ar: "حالة PLC" },
  "settings.language": { en: "Language", ar: "اللغة" },
  "settings.theme": { en: "Theme", ar: "السمة" },
  "settings.wifi": { en: "WiFi", ar: "الواي فاي" },
  "settings.lan": { en: "LAN Network", ar: "شبكة LAN" },
  "settings.plcNetwork": { en: "PLC Network", ar: "شبكة PLC" },
  "test.status": { en: "Test Status", ar: "حالة الاختبار" },
  // Dashboard Groups
  "dashboard.group.test": { en: "Test", ar: "اختبار" },
  "dashboard.group.jog": { en: "Jog", ar: "تحريك" },
  "dashboard.group.step": { en: "Step", ar: "خطوة" },
  "dashboard.group.jaw": { en: "Jaw", ar: "فك" },
  "dashboard.group.servo": { en: "Servo", ar: "سيرفو" },
  "dashboard.dist": { en: "Dist", ar: "مسافة" },
  "dashboard.stepDistance": { en: "Step Distance", ar: "مسافة الخطوة" },
  "dashboard.speedUnit": { en: "mm/m", ar: "مم/د" },

  // History Page
  "history.refresh": { en: "Refresh", ar: "تحديث" },
  "history.noTests": { en: "No test history", ar: "لا توجد اختبارات سابقة" },
  "history.diameter": { en: "Dia:", ar: "القطر:" },
  "history.force": { en: "Force:", ar: "القوة:" },
  "history.sn": { en: "SN:", ar: "SN:" },
  "history.downloadPdf": { en: "Download as PDF", ar: "تحميل كـ PDF" },
  "history.downloadExcel": { en: "Download as Excel", ar: "تحميل كـ Excel" },

  // Settings Extras
  "settings.dark": { en: "Dark", ar: "داكن" },
  "settings.light": { en: "Light", ar: "فاتح" },
  "settings.ipAddress": { en: "IP Address", ar: "عنوان IP" },
  "settings.subnet": { en: "Subnet", ar: "قناع الشبكة" },
  "settings.gateway": { en: "Gateway", ar: "البوابة" },
  "settings.modeLabel": { en: "Mode:", ar: "الوضع:" },
  "settings.save": { en: "Save", ar: "حفظ" },
  "settings.cancel": { en: "Cancel", ar: "إلغاء" },
  "settings.connect": { en: "Connect", ar: "اتصال" },
  "settings.connectTo": { en: "Connect to", ar: "الاتصال بـ" },
  "settings.password": { en: "Password", ar: "كلمة المرور" },
  "settings.enterPassword": { en: "Enter password", ar: "أدخل كلمة المرور" },
  "settings.enterAddress": { en: "Enter Address", ar: "أدخل العنوان" },
  "settings.lanLabel": { en: "LAN", ar: "الشبكة المحلية" },
  "settings.plcNetworkLabel": { en: "PLC Network", ar: "شبكة PLC" },
  "settings.generalNetworkLabel": { en: "General Network", ar: "الشبكة العامة" },
  "settings.reportsUsbExport": { en: "Reports & USB Export", ar: "التقارير وتصدير USB" },

  // Cursor
  "settings.mouseCursor": { en: "Mouse Cursor", ar: "مؤشر الفأرة" },
  "settings.cursorVisible": { en: "Visible", ar: "ظاهر" },
  "settings.cursorHidden": { en: "Hidden", ar: "مخفي" },

  // Report Settings
  "settings.reportOptions": { en: "Report Options", ar: "خيارات التقرير" },
  "settings.forceUnit": { en: "Force Unit in Report", ar: "وحدة القوة في التقرير" },

  // Power Dialogs
  "power.shutdown": { en: "Shutdown System", ar: "إيقاف تشغيل النظام" },
  "power.shutdownConfirm": { en: "Are you sure you want to shutdown the system?", ar: "هل أنت متأكد من إيقاف تشغيل النظام؟" },
  "power.shutdownBtn": { en: "Shutdown", ar: "إيقاف" },
  "power.restart": { en: "Restart System", ar: "إعادة تشغيل النظام" },
  "power.restartConfirm": { en: "Are you sure you want to restart the system?", ar: "هل أنت متأكد من إعادة تشغيل النظام؟" },
  "power.restartBtn": { en: "Restart", ar: "إعادة التشغيل" },
  "power.cancel": { en: "Cancel", ar: "إلغاء" },

  // Test Setup extras
  "testSetup.testInfo": { en: "Test Information", ar: "معلومات الاختبار" },
  "testSetup.sampleId": { en: "Sample ID", ar: "رقم العينة" },
  "testSetup.operator": { en: "Operator", ar: "المشغل" },
  "testSetup.notes": { en: "Notes", ar: "ملاحظات" },

  // Report
  "report.title": { en: "Ring Stiffness Test Report", ar: "تقرير اختبار الصلابة الحلقية" },
  "report.pass": { en: "PASS", ar: "ناجح" },
  "report.fail": { en: "FAIL", ar: "راسب" },
  "report.testInfo": { en: "Test Information", ar: "معلومات الاختبار" },
  "report.testId": { en: "Test ID", ar: "رقم الاختبار" },
  "report.date": { en: "Date", ar: "التاريخ" },
  "report.sampleId": { en: "Sample ID", ar: "رقم العينة" },
  "report.operator": { en: "Operator", ar: "المشغل" },
  "report.parameters": { en: "Test Parameters", ar: "معاملات الاختبار" },
  "report.pipeDiameter": { en: "Pipe Diameter", ar: "قطر الأنبوب" },
  "report.pipeLength": { en: "Pipe Length", ar: "طول الأنبوب" },
  "report.deflectionPercent": { en: "Deflection %", ar: "نسبة الانحراف" },
  "report.testSpeed": { en: "Test Speed", ar: "سرعة الاختبار" },
  "report.results": { en: "Results", ar: "النتائج" },
  "report.ringStiffness": { en: "Ring Stiffness", ar: "الصلابة الحلقية" },
  "report.snClass": { en: "SN Class", ar: "تصنيف SN" },
  "report.forceAtTarget": { en: "Force at Target", ar: "القوة عند الهدف" },
  "report.maxForce": { en: "Max Force", ar: "أقصى قوة" },
  "report.duration": { en: "Duration", ar: "المدة" },
  "report.dataPoints": { en: "Data Points", ar: "نقاط البيانات" },
  "report.forceDeflectionChart": { en: "Force-Deflection Curve", ar: "منحنى القوة-الانحراف" },
  "report.loading": { en: "Loading report...", ar: "جاري تحميل التقرير..." },
  "report.noData": { en: "No chart data available", ar: "لا توجد بيانات للرسم البياني" },
  "report.generatedBy": { en: "Generated by GRP Stiffness Test System", ar: "تم إنشاؤه بواسطة نظام اختبار صلابة GRP" },
  "report.close": { en: "Close", ar: "إغلاق" },
  "report.print": { en: "Print", ar: "طباعة" },

  // Report - Product Information
  "report.productInfo": { en: "Product Information", ar: "معلومات المنتج" },
  "report.lotNumber": { en: "Lot Number", ar: "رقم الدفعة" },
  "report.nominalDiameter": { en: "Nominal Diameter", ar: "القطر الاسمي" },
  "report.pressureClass": { en: "Pressure Class", ar: "فئة الضغط" },
  "report.stiffnessClass": { en: "Stiffness Class", ar: "فئة الصلابة" },
  "report.productId": { en: "Product ID", ar: "معرف المنتج" },
  "report.thickness": { en: "Thickness", ar: "السُمك" },
  "report.nominalWeight": { en: "Nominal Weight", ar: "الوزن الاسمي" },

  // Report - Project Information
  "report.projectInfo": { en: "Project Information", ar: "معلومات المشروع" },
  "report.projectName": { en: "Project Name", ar: "اسم المشروع" },
  "report.customerName": { en: "Customer Name", ar: "اسم العميل" },
  "report.poNumber": { en: "PO Number", ar: "رقم أمر الشراء" },

  // Export / USB
  "export.title": { en: "Reports & USB Export", ar: "التقارير وتصدير USB" },
  "export.noUsb": { en: "No USB detected", ar: "لم يتم اكتشاف USB" },
  "export.free": { en: "free", ar: "متاح" },
  "export.selectAll": { en: "Select All", ar: "تحديد الكل" },
  "export.deselectAll": { en: "Deselect All", ar: "إلغاء التحديد" },
  "export.exportUsb": { en: "Export to USB", ar: "تصدير إلى USB" },
  "export.exporting": { en: "Exporting...", ar: "جاري التصدير..." },
  "export.download": { en: "Download", ar: "تحميل" },
  "export.downloadComplete": { en: "Download complete", ar: "اكتمل التحميل" },
  "export.exportComplete": { en: "Export complete", ar: "اكتمل التصدير" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || key;
  };

  const isRTL = language === "ar";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      <div dir={isRTL ? "rtl" : "ltr"}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
