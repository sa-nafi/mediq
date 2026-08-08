import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { FileSearch, Eye, Clock, Database, User as UserIcon, Hash } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function AuditLogsPage() {
  const [cursorStack, setCursorStack] = useState<string[]>(['']);
  const [pageIndex, setPageIndex] = useState(0);
  const [tableFilter, setTableFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  const currentCursor = cursorStack[pageIndex];

  const { data: logsData, isLoading, error } = useQuery({
    queryKey: ['admin', 'audit-logs', currentCursor, tableFilter, actionFilter],
    queryFn: () => adminApi.getAuditLogs({ 
      cursor: currentCursor || undefined, 
      limit: 15,
      table: tableFilter || undefined,
      action: actionFilter || undefined
    }),
  });

  // Fetch the full detail (with old_data / new_data) only when a log is selected
  const { data: logDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['admin', 'audit-log-detail', selectedLogId],
    queryFn: () => adminApi.getAuditLogById(selectedLogId!),
    enabled: !!selectedLogId,
  });

  const logs = logsData?.data || [];
  const nextCursor = logsData?.next_cursor;

  const handleNext = () => {
    if (nextCursor) {
      if (pageIndex === cursorStack.length - 1) {
        setCursorStack([...cursorStack, nextCursor]);
      }
      setPageIndex(p => p + 1);
    }
  };

  const handlePrev = () => {
    if (pageIndex > 0) {
      setPageIndex(p => p - 1);
    }
  };

  const resetPagination = () => {
    setCursorStack(['']);
    setPageIndex(0);
  };

  const actionBadge = (action: string) => {
    const map: Record<string, string> = {
      INSERT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      UPDATE: 'bg-amber-50 text-amber-700 border-amber-200',
      DELETE: 'bg-red-50 text-red-700 border-red-200',
    };
    return map[action] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  // Render a JSON object as a clean key-value table instead of raw JSON
  const renderDataTable = (data: any, variant: 'old' | 'new') => {
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) return null;

    const colorClasses = variant === 'old' 
      ? { bg: 'bg-red-50/50', border: 'border-red-100', header: 'bg-red-100/60 text-red-800', cell: 'text-red-900' }
      : { bg: 'bg-emerald-50/50', border: 'border-emerald-100', header: 'bg-emerald-100/60 text-emerald-800', cell: 'text-emerald-900' };

    return (
      <div className={`rounded-xl ${colorClasses.border} border overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={colorClasses.header}>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider">Field</th>
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${colorClasses.border}`}>
            {Object.entries(data).map(([key, value]) => (
              <tr key={key} className={colorClasses.bg}>
                <td className={`px-4 py-2 font-bold text-xs ${colorClasses.cell}`}>{key}</td>
                <td className={`px-4 py-2 text-xs ${colorClasses.cell} font-mono break-all`}>
                  {value === null ? <span className="italic opacity-50">null</span> : String(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Audit Logs</h1>
          <p className="text-muted mt-0.5 text-sm">System-wide audit trail of data modifications.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-surface p-4 rounded-xl border border-border-light shadow-sm">
        <div className="flex flex-col gap-1 w-full sm:w-auto">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Table</label>
          <CustomSelect
            value={tableFilter}
            onChange={(val) => { setTableFilter(val); resetPagination(); }}
            placeholder="All Tables"
            options={[
              { label: 'All Tables', value: '' },
              { label: 'Patients', value: 'patients' },
              { label: 'Employees', value: 'employees' },
              { label: 'Doctors', value: 'doctors' },
              { label: 'Appointments', value: 'appointments' },
              { label: 'Medical Records', value: 'medical_records' },
              { label: 'Medical Tests', value: 'medical_tests' },
              { label: 'Prescriptions', value: 'prescriptions' },
              { label: 'Medicines', value: 'medicines' },
            ]}
          />
        </div>
        
        <div className="flex flex-col gap-1 w-full sm:w-auto">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Action</label>
          <CustomSelect
            value={actionFilter}
            onChange={(val) => { setActionFilter(val); resetPagination(); }}
            placeholder="All Actions"
            options={[
              { label: 'All Actions', value: '' },
              { label: 'INSERT', value: 'INSERT' },
              { label: 'UPDATE', value: 'UPDATE' },
              { label: 'DELETE', value: 'DELETE' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border-light bg-surface shadow-sm">
          <p className="text-muted text-sm font-medium">Loading audit logs...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col items-center justify-center text-red-600 gap-2 shadow-sm">
          <FileSearch className="h-8 w-8 opacity-80" />
          <p className="text-base font-bold">Failed to load audit logs.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-surface rounded-xl border border-border-light shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted uppercase bg-secondary/5 border-b border-border-light">
                  <tr>
                    <th className="px-4 py-3 font-bold tracking-wider">Time</th>
                    <th className="px-4 py-3 font-bold tracking-wider">Action</th>
                    <th className="px-4 py-3 font-bold tracking-wider">Table</th>
                    <th className="px-4 py-3 font-bold tracking-wider">Record ID</th>
                    <th className="px-4 py-3 font-bold tracking-wider">User ID</th>
                    <th className="px-4 py-3 font-bold tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {logs.length > 0 ? logs.map((log: any) => (
                    <tr key={log.audit_id} className="hover:bg-secondary/5 transition-colors group">
                      <td className="px-4 py-3 font-medium">{dayjs(log.changed_at).format('MMM D, YYYY HH:mm:ss')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${actionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-foreground">{log.table_name}</td>
                      <td className="px-4 py-3">{log.record_id}</td>
                      <td className="px-4 py-3 text-muted">{log.changed_by || 'System'}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted hover:text-primary" onClick={() => setSelectedLogId(log.audit_id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted">No audit logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted">
              Page {pageIndex + 1}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrev} disabled={pageIndex === 0}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext} disabled={!nextCursor}>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Dialog — fetches full detail from API */}
      <Dialog open={!!selectedLogId} onOpenChange={(open) => !open && setSelectedLogId(null)}>
        <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FileSearch className="h-5 w-5 text-primary" />
              Audit Log Details
            </DialogTitle>
          </DialogHeader>
          
          {isDetailLoading ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted text-sm font-medium">Loading details...</p>
            </div>
          ) : logDetail ? (
            <div className="space-y-5 mt-4">
              {/* Metadata cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-surface p-3 border border-border-light rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Database className="h-3.5 w-3.5 text-muted" />
                    <p className="text-[10px] uppercase font-bold text-muted">Action</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${actionBadge(logDetail.action)}`}>
                    {logDetail.action}
                  </span>
                </div>
                <div className="bg-surface p-3 border border-border-light rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Database className="h-3.5 w-3.5 text-muted" />
                    <p className="text-[10px] uppercase font-bold text-muted">Table</p>
                  </div>
                  <p className="font-bold text-foreground text-sm">{logDetail.table_name}</p>
                </div>
                <div className="bg-surface p-3 border border-border-light rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Hash className="h-3.5 w-3.5 text-muted" />
                    <p className="text-[10px] uppercase font-bold text-muted">Record ID</p>
                  </div>
                  <p className="font-bold text-foreground text-sm">#{logDetail.record_id}</p>
                </div>
                <div className="bg-surface p-3 border border-border-light rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="h-3.5 w-3.5 text-muted" />
                    <p className="text-[10px] uppercase font-bold text-muted">Time</p>
                  </div>
                  <p className="font-bold text-foreground text-sm">{dayjs(logDetail.changed_at).format('MMM D, HH:mm')}</p>
                </div>
              </div>

              <div className="bg-surface p-3 border border-border-light rounded-xl flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted" />
                <span className="text-[10px] uppercase font-bold text-muted">Changed By:</span>
                <span className="text-sm font-bold text-foreground">User #{logDetail.changed_by || 'System'}</span>
                <span className="text-muted text-xs ml-auto">{dayjs(logDetail.changed_at).format('MMMM D, YYYY [at] HH:mm:ss')}</span>
              </div>

              {/* Data sections */}
              {logDetail.old_data && typeof logDetail.old_data === 'object' && Object.keys(logDetail.old_data).length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">⬅ Previous Data</p>
                  {renderDataTable(logDetail.old_data, 'old')}
                </div>
              )}

              {logDetail.new_data && typeof logDetail.new_data === 'object' && Object.keys(logDetail.new_data).length > 0 && (
                <div>
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">➡ New Data</p>
                  {renderDataTable(logDetail.new_data, 'new')}
                </div>
              )}

              {/* Fallback if both are empty */}
              {(!logDetail.old_data || Object.keys(logDetail.old_data).length === 0) && 
               (!logDetail.new_data || Object.keys(logDetail.new_data).length === 0) && (
                <div className="py-8 text-center text-muted text-sm">
                  No data changes were recorded for this audit event.
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted text-sm">Could not load audit log details.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
