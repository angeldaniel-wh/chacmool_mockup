import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, X, CheckCircle2, Clock, Lock, Mail, FileSignature, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { vacationsAPI } from '../services/api';

// =============== Helpers ===============
const fmtCellDate = (iso) => {
  if (!iso) return ['', '', ''];
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return ['', '', ''];
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getFullYear()),
  ];
};

const buildFolio = (id) => {
  if (!id) return 'REQ-000';
  const short = String(id).replace(/-/g, '').slice(-3).toUpperCase();
  return `REQ-${short.padStart(3, '0')}`;
};

const splitName = (fullName) => {
  if (!fullName) return { paterno: '', materno: '', nombres: '' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { paterno: '', materno: '', nombres: parts[0] };
  if (parts.length === 2) return { paterno: parts[1], materno: '', nombres: parts[0] };
  if (parts.length === 3) return { paterno: parts[1], materno: parts[2], nombres: parts[0] };
  // 4+
  return {
    paterno: parts[parts.length - 2],
    materno: parts[parts.length - 1],
    nombres: parts.slice(0, parts.length - 2).join(' '),
  };
};

const fmtTimestamp = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  } catch (e) {
    return '';
  }
};

// =============== Email Sent Modal ===============
const EmailSentModal = ({ stage, onClose }) => {
  const stageLabel =
    stage === 'employee' ? 'Empleado' : stage === 'manager' ? 'Gerencia' : 'Director General';
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="email-sent-modal"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="px-6 pt-7 pb-4 flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Mail className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="flex-1 pt-1">
            <h3 className="text-lg font-bold text-slate-900">¡Solicitud de autorización enviada!</h3>
            <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">
              Etapa: {stageLabel}
            </p>
          </div>
        </div>
        <div className="px-6 pb-5">
          <p className="text-sm text-slate-700 leading-relaxed">
            Se ha enviado la solicitud de autorización. Por favor, revisa tu correo electrónico
            para confirmar la firma de esta etapa.
          </p>
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2 text-xs text-slate-600">
            <Mail className="w-4 h-4 mt-0.5 text-slate-500 flex-shrink-0" />
            <span>
              Al hacer clic en <strong className="text-slate-900">"Enterado"</strong> se registrará tu
              firma electrónica y la etapa cambiará a estado <strong className="text-emerald-700">verde (autorizado)</strong>.
            </span>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm"
            data-testid="email-sent-enterado"
          >
            <CheckCircle2 className="w-4 h-4" />
            Enterado
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// =============== Signature Cell ===============
const SignatureCell = ({ title, signed, signedName, signedAt, canSign, onSignClick, signing }) => {
  // Estados visuales
  const palette = signed
    ? { ring: 'ring-emerald-300', bg: 'bg-emerald-50/60', dot: 'bg-emerald-500', label: 'AUTORIZADO', labelCls: 'text-emerald-700', icon: CheckCircle2, iconCls: 'text-emerald-600' }
    : canSign
    ? { ring: 'ring-amber-200', bg: 'bg-amber-50/40', dot: 'bg-amber-500', label: 'PENDIENTE', labelCls: 'text-amber-700', icon: Clock, iconCls: 'text-amber-600' }
    : { ring: 'ring-slate-200', bg: 'bg-slate-50/60', dot: 'bg-slate-300', label: 'PENDIENTE', labelCls: 'text-slate-500', icon: Lock, iconCls: 'text-slate-400' };

  const Icon = palette.icon;

  return (
    <div
      className={`relative border ${palette.ring} ring-1 ${palette.bg} rounded-md p-3 min-h-[150px] flex flex-col`}
      data-testid={`signature-cell-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-700">
          {title}
        </span>
        <Icon className={`w-3.5 h-3.5 ${palette.iconCls}`} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {signed ? (
          <>
            <div className="w-full">
              <p className="text-xs text-slate-700 font-semibold italic">
                {signedName || '—'}
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">{fmtTimestamp(signedAt)}</p>
            </div>
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">
              <span className={`w-1 h-1 rounded-full ${palette.dot}`} />
              {palette.label}
            </div>
          </>
        ) : canSign ? (
          <button
            type="button"
            onClick={onSignClick}
            disabled={signing}
            className="print:hidden inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
            data-testid={`sign-button-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {signing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSignature className="w-3.5 h-3.5" />}
            Firmar / Autorizar
          </button>
        ) : (
          <span className="text-[10px] text-slate-400 italic">Esperando autorización</span>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-dashed border-slate-300">
        <p className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-semibold text-center">
          Nombre y Firma
        </p>
      </div>
    </div>
  );
};

// =============== Main Document ===============
export const VacationDocument = ({ request: initialRequest, employee, currentUser, onClose, onUpdate }) => {
  const [request, setRequest] = useState(initialRequest);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pendingStage, setPendingStage] = useState(null); // stage cuya firma se acaba de "enviar"
  const [signing, setSigning] = useState(null); // stage being signed
  const paperRef = useRef(null);

  if (!request) return null;

  const role = (currentUser?.role || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'manager';
  const isEmployee = role === 'empleado' || role === 'employee';

  // Permisos
  const canSignEmployee =
    !request.signedByEmployee &&
    (isEmployee || isAdmin) &&
    (isAdmin || request.employeeId === currentUser?.employee_id);
  const canSignManager = !request.signedByManager && isAdmin;
  const canSignDirector = !request.signedByDirector && isAdmin;

  const folio = buildFolio(request.id);
  const fechaEmision = new Date();
  const [dDay, dMonth, dYear] = [
    String(fechaEmision.getDate()).padStart(2, '0'),
    String(fechaEmision.getMonth() + 1).padStart(2, '0'),
    String(fechaEmision.getFullYear()),
  ];

  const employeeName = request.employeeName || employee?.name || '';
  const { paterno, materno, nombres } = splitName(employeeName);
  const empDepartment = request.employeeDepartment || employee?.department || '';
  const empPosition = employee?.position || '';

  const [s1d, s1m, s1y] = fmtCellDate(request.startDate);
  const [s2d, s2m, s2y] = fmtCellDate(request.endDate);
  const [s3d, s3m, s3y] = fmtCellDate(request.returnDate);

  const handleSign = (stage) => {
    setPendingStage(stage);
  };

  const handleEnterado = async () => {
    if (!pendingStage) return;
    const stage = pendingStage;
    setPendingStage(null);
    setSigning(stage);
    try {
      const updated = await vacationsAPI.sign(request.id, stage);
      setRequest(updated);
      if (onUpdate) onUpdate(updated);
    } catch (e) {
      // Mantener silencio simple — alert sólo en caso real
      window.alert(e.message || 'Error al firmar');
    } finally {
      setSigning(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!paperRef.current) return;
    setDownloadingPdf(true);
    try {
      // Captura visible al PDF
      const canvas = await html2canvas(paperRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: paperRef.current.scrollWidth,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgRatio = canvas.height / canvas.width;
      const renderWidth = pdfWidth;
      const renderHeight = renderWidth * imgRatio;
      let position = 0;
      let heightLeft = renderHeight;
      pdf.addImage(imgData, 'PNG', 0, position, renderWidth, renderHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position = heightLeft - renderHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, renderWidth, renderHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(`Vacaciones_${folio}_${employeeName.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error(e);
      window.alert('No se pudo generar el PDF: ' + (e.message || 'desconocido'));
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto print:bg-white print:static"
        data-testid="vacation-document-overlay"
      >
        {/* Toolbar */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 print:hidden">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
            <button
              onClick={onClose}
              data-testid="doc-back-btn"
              className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="uppercase tracking-wider text-xs font-semibold">
                Vista previa de documento
              </span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                data-testid="doc-download-btn"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloadingPdf ? 'Generando…' : 'Descargar PDF'}
              </button>
              <button
                onClick={onClose}
                data-testid="doc-close-btn"
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
                Cerrar
              </button>
            </div>
          </div>
        </div>

        {/* A4 Paper */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="max-w-4xl mx-auto my-8 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-0 print:rounded-none print:my-0 print:max-w-none"
        >
          <div ref={paperRef} className="bg-white px-10 py-8 print:px-12 print:py-10 text-[11px] font-sans">
            {/* Top Header Strip */}
            <div className="grid grid-cols-2 border-2 border-slate-900">
              {/* Left: Wisphub branding */}
              <div className="bg-emerald-700 text-white px-4 py-3 flex items-center gap-3 border-r-2 border-slate-900">
                <div className="bg-white text-emerald-700 w-10 h-10 rounded-md font-black text-2xl flex items-center justify-center shadow-sm">
                  W
                </div>
                <div className="leading-tight">
                  <h1 className="text-2xl font-black tracking-tight">Wisphub</h1>
                  <p className="text-[9px] uppercase tracking-widest opacity-90">
                    Recursos Humanos
                  </p>
                </div>
              </div>
              {/* Right: Title + folio */}
              <div className="px-4 py-3 flex flex-col justify-center text-right">
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight leading-snug">
                  Formato de Vacaciones
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Folio: {folio}</p>
              </div>
            </div>

            {/* Date row */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] border-x-2 border-b-2 border-slate-900 text-center">
              <div className="px-3 py-2 border-r-2 border-slate-900 bg-slate-50/60 text-left flex items-center">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-700">FECHA:</span>
              </div>
              <div className="border-r border-slate-300 min-w-[80px]">
                <div className="text-[8px] uppercase tracking-wider font-bold text-slate-500 px-2 pt-1">DÍA</div>
                <div className="text-base font-bold text-slate-900 px-2 pb-1.5">{dDay}</div>
              </div>
              <div className="border-r border-slate-300 min-w-[80px]">
                <div className="text-[8px] uppercase tracking-wider font-bold text-slate-500 px-2 pt-1">MES</div>
                <div className="text-base font-bold text-slate-900 px-2 pb-1.5">{dMonth}</div>
              </div>
              <div className="min-w-[100px]">
                <div className="text-[8px] uppercase tracking-wider font-bold text-slate-500 px-2 pt-1">AÑO</div>
                <div className="text-base font-bold text-slate-900 px-2 pb-1.5">{dYear}</div>
              </div>
            </div>

            {/* Datos del empleado */}
            <div className="border-x-2 border-b-2 border-slate-900 grid grid-cols-3">
              <DocField label="APELLIDO PATERNO" value={paterno} borderRight />
              <DocField label="APELLIDO MATERNO" value={materno} borderRight />
              <DocField label="NOMBRE(S)" value={nombres} />
            </div>
            <div className="border-x-2 border-b-2 border-slate-900 grid grid-cols-2">
              <DocField label="ÁREA O GERENCIA" value={empDepartment} borderRight />
              <DocField label="PUESTO" value={empPosition} />
            </div>

            {/* Concepto de Vacaciones header */}
            <div className="bg-emerald-700 text-white text-center py-2 border-x-2 border-b-2 border-slate-900">
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">
                CONCEPTO DE VACACIONES
              </h3>
            </div>

            {/* Vacation table */}
            <div className="border-x-2 border-b-2 border-slate-900 grid grid-cols-[1fr_auto_auto_auto] text-center">
              {/* Header row */}
              <div className="bg-slate-100 border-r-2 border-b-2 border-slate-900 py-2 px-2 text-[9px] uppercase tracking-wider font-bold text-slate-700 flex items-center justify-center">
                FECHA DE INICIO DE VACACIONES
              </div>
              <div className="bg-slate-100 border-r border-b-2 border-slate-900 py-2 px-2 min-w-[60px]">
                <div className="text-[8px] font-bold text-slate-500">DÍA</div>
              </div>
              <div className="bg-slate-100 border-r border-b-2 border-slate-900 py-2 px-2 min-w-[60px]">
                <div className="text-[8px] font-bold text-slate-500">MES</div>
              </div>
              <div className="bg-slate-100 border-b-2 border-slate-900 py-2 px-2 min-w-[80px]">
                <div className="text-[8px] font-bold text-slate-500">AÑO</div>
              </div>

              {/* Inicio values */}
              <div className="border-r-2 border-b border-slate-900 py-2 px-2 text-left text-[10px] text-slate-600 flex items-center">
                <span className="italic">Inicio del periodo solicitado</span>
              </div>
              <div className="border-r border-b border-slate-300 py-2 px-2 text-base font-bold text-slate-900">{s1d}</div>
              <div className="border-r border-b border-slate-300 py-2 px-2 text-base font-bold text-slate-900">{s1m}</div>
              <div className="border-b border-slate-300 py-2 px-2 text-base font-bold text-slate-900">{s1y}</div>

              {/* Termino label */}
              <div className="border-r-2 border-b-2 border-slate-900 py-2 px-2 text-[9px] uppercase tracking-wider font-bold text-slate-700 flex items-center justify-center">
                FECHA DE TÉRMINO DE VACACIONES
              </div>
              <div className="border-r border-b-2 border-slate-300 py-2 px-2 text-base font-bold text-slate-900">{s2d}</div>
              <div className="border-r border-b-2 border-slate-300 py-2 px-2 text-base font-bold text-slate-900">{s2m}</div>
              <div className="border-b-2 border-slate-300 py-2 px-2 text-base font-bold text-slate-900">{s2y}</div>

              {/* Reincorporación label */}
              <div className="border-r-2 border-b-2 border-slate-900 py-2 px-2 text-[9px] uppercase tracking-wider font-bold text-slate-700 flex items-center justify-center">
                FECHA DE REINCORPORACIÓN
              </div>
              <div className="border-r border-b-2 border-slate-300 py-2 px-2 text-base font-bold text-emerald-700">{s3d}</div>
              <div className="border-r border-b-2 border-slate-300 py-2 px-2 text-base font-bold text-emerald-700">{s3m}</div>
              <div className="border-b-2 border-slate-300 py-2 px-2 text-base font-bold text-emerald-700">{s3y}</div>

              {/* Total días */}
              <div className="bg-slate-100 border-r-2 border-slate-900 py-2 px-2 text-right text-xs uppercase tracking-wider font-bold text-slate-800 flex items-center justify-end">
                No. DE DÍAS:
              </div>
              <div
                className="col-span-3 bg-emerald-50 py-2 px-3 text-center text-2xl font-black text-emerald-700"
              >
                {request.totalDays}
              </div>
            </div>

            {/* Observaciones */}
            <div className="border-x-2 border-b-2 border-slate-900">
              <div className="bg-slate-100 border-b-2 border-slate-900 px-3 py-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-700">
                  OBSERVACIONES
                </span>
              </div>
              <div className="px-4 py-3 min-h-[60px] text-sm text-slate-700 italic">
                {request.reason ? request.reason : <span className="text-slate-400">Sin observaciones adicionales.</span>}
                {request.adminComment && (
                  <div className="mt-2 pt-2 border-t border-dashed border-slate-300 not-italic">
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">
                      Nota administrativa:{' '}
                    </span>
                    <span className="text-slate-700">{request.adminComment}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Firmas */}
            <div className="border-x-2 border-b-2 border-slate-900">
              <div className="bg-emerald-700 text-white text-center py-1.5">
                <span className="text-xs font-black uppercase tracking-[0.2em]">
                  Flujo de Firmas y Aprobaciones
                </span>
              </div>
              <div className="grid grid-cols-3 p-3 gap-3">
                <SignatureCell
                  title="Empleado"
                  signed={!!request.signedByEmployee}
                  signedName={request.signedByEmployeeName || employeeName}
                  signedAt={request.signedByEmployeeAt}
                  canSign={canSignEmployee}
                  signing={signing === 'employee'}
                  onSignClick={() => handleSign('employee')}
                />
                <SignatureCell
                  title="Gerencia"
                  signed={!!request.signedByManager}
                  signedName={request.signedByManagerName}
                  signedAt={request.signedByManagerAt}
                  canSign={canSignManager}
                  signing={signing === 'manager'}
                  onSignClick={() => handleSign('manager')}
                />
                <SignatureCell
                  title="Director General"
                  signed={!!request.signedByDirector}
                  signedName={request.signedByDirectorName}
                  signedAt={request.signedByDirectorAt}
                  canSign={canSignDirector}
                  signing={signing === 'director'}
                  onSignClick={() => handleSign('director')}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 text-center text-[9px] text-slate-400 italic">
              Documento generado por el sistema WispHub · {new Date().getFullYear()}
            </div>
          </div>
        </motion.div>

        <style>{`
          @media print {
            @page { size: A4; margin: 12mm; }
            body { background: white !important; }
            .print\\:hidden { display: none !important; }
          }
        `}</style>

        {pendingStage && <EmailSentModal stage={pendingStage} onClose={handleEnterado} />}
      </motion.div>
    </AnimatePresence>
  );
};

const DocField = ({ label, value, borderRight }) => (
  <div className={`px-3 py-2 ${borderRight ? 'border-r border-slate-900' : ''}`}>
    <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-1">{label}</p>
    <p className="text-sm font-semibold text-slate-900 min-h-[20px]">{value || '—'}</p>
  </div>
);

export default VacationDocument;
