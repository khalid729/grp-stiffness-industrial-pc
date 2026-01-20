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
  "test.status": { en: "Test Status", ar: "حالة الاختبار" },
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
