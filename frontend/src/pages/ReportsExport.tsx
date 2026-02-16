import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTestHistory, useUsbDevices, useUsbExport } from '@/hooks/useApi';
import { TouchButton } from '@/components/ui/TouchButton';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Usb, FileText, FileSpreadsheet, Download, Loader2,
  CheckCircle, XCircle, HardDrive, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ReportsExport = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { tests, isLoading, refetch } = useTestHistory();
  const { devices, isLoading: usbLoading, refetch: refetchUsb } = useUsbDevices();
  const usbExport = useUsbExport();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');

  const allSelected = tests.length > 0 && selectedIds.size === tests.length;

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tests.map(t => t.id)));
    }
  };

  const selectedUsb = devices.length > 0 ? devices[0] : null;

  const handleExportUsb = () => {
    if (!selectedUsb || selectedIds.size === 0) return;
    usbExport.mutate({
      test_ids: Array.from(selectedIds),
      format,
      usb_path: selectedUsb.path,
    });
  };

  const handleDownload = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    // Download one by one (browser download)
    for (const id of ids) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const endpoint = format === 'pdf'
          ? `/api/report/pdf/${id}?force_unit=${localStorage.getItem('report_force_unit') || 'N'}`
          : `/api/report/excel/${id}`;
        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test_report_${id}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch {
        toast.error(`Failed to download test ${id}`);
      }
    }
    toast.success(t('export.downloadComplete'));
  };

  return (
    <div className="flex flex-col h-full gap-2 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TouchButton variant="outline" size="sm" onClick={() => navigate('/settings')} className="px-2">
          <ArrowLeft className="w-5 h-5" />
        </TouchButton>
        <HardDrive className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold">{t('export.title')}</h1>
      </div>

      {/* USB Status */}
      <div className="industrial-card p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Usb className={cn("w-5 h-5", selectedUsb ? "text-success" : "text-muted-foreground")} />
          {selectedUsb ? (
            <div className="flex items-center gap-2">
              <span className="font-medium">{selectedUsb.label}</span>
              {selectedUsb.free_gb != null && (
                <Badge variant="outline" className="text-xs">
                  {selectedUsb.free_gb} GB {t('export.free')}
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{t('export.noUsb')}</span>
          )}
        </div>
        <TouchButton variant="outline" size="sm" onClick={() => refetchUsb()} disabled={usbLoading} className="px-2">
          <RefreshCw className={cn("w-4 h-4", usbLoading && "animate-spin")} />
        </TouchButton>
      </div>

      {/* Format Toggle + Select All */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          <TouchButton
            variant={format === 'pdf' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFormat('pdf')}
            className="min-h-[40px]"
          >
            <FileText className="w-4 h-4 mr-1" />
            PDF
          </TouchButton>
          <TouchButton
            variant={format === 'excel' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFormat('excel')}
            className="min-h-[40px]"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1" />
            Excel
          </TouchButton>
        </div>
        <TouchButton variant="outline" size="sm" onClick={toggleAll} className="min-h-[40px]">
          {allSelected ? t('export.deselectAll') : t('export.selectAll')}
          <Badge variant="secondary" className="ml-1 text-xs">{selectedIds.size}/{tests.length}</Badge>
        </TouchButton>
      </div>

      {/* Test List with Checkboxes */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : tests.length === 0 ? (
          <div className="industrial-card p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">{t('history.noTests')}</p>
          </div>
        ) : (
          tests.map(test => (
            <div
              key={test.id}
              className={cn(
                "industrial-card p-2 flex items-center gap-3 cursor-pointer transition-all",
                selectedIds.has(test.id) && "ring-2 ring-primary/50 bg-primary/5"
              )}
              onClick={() => toggleSelect(test.id)}
            >
              <Checkbox
                checked={selectedIds.has(test.id)}
                onCheckedChange={() => toggleSelect(test.id)}
                className="w-6 h-6"
              />
              <div className={cn(
                'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                test.passed ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
              )}>
                {test.passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold">#{test.id}</span>
                  {test.sample_id && <span className="text-sm text-muted-foreground">{test.sample_id}</span>}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(test.test_date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>{test.pipe_diameter}mm</span>
                  <span>SN {test.sn_class || '-'}</span>
                  {test.operator && <span>{test.operator}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Bar */}
      <div className="flex gap-2 pt-1">
        <TouchButton
          variant="primary"
          size="sm"
          onClick={handleExportUsb}
          disabled={!selectedUsb || selectedIds.size === 0 || usbExport.isPending}
          className="flex-1 min-h-[48px]"
        >
          {usbExport.isPending ? (
            <Loader2 className="w-5 h-5 mr-1 animate-spin" />
          ) : (
            <Usb className="w-5 h-5 mr-1" />
          )}
          {usbExport.isPending ? t('export.exporting') : t('export.exportUsb')}
        </TouchButton>
        <TouchButton
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={selectedIds.size === 0}
          className="flex-1 min-h-[48px]"
        >
          <Download className="w-5 h-5 mr-1" />
          {t('export.download')}
        </TouchButton>
      </div>
    </div>
  );
};

export default ReportsExport;
