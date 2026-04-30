import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, X, CheckCircle2, Clock, Lock, Palmtree, XCircle } from 'lucide-react';

// ============== Helpers ==============
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('es-ES');
};

const todayShort = () => new Date().toLocaleDateString('es-ES');

const buildFolio = (id) => {
  if (!id) return 'REQ-000';
  const short = String(id).replace(/-/g, '').slice(-3).toUpperCase();
  return `REQ-${short.padStart(3, '0')}`;
};

// Estado de firma por bloque según status del request
const signatureFlow = (status) => {
  if (status === 'Rechazado') {
    return {
      employee: { type: 'firmado', label: 'Firmado electrónicamente' },
      manager: { type: 'rechazado', label: 'Rechazado' },
      director: { type: 'bloqueado', label: 'Esperando firma previa' },
    };
  }
  if (status === 'Aprobado' || status === 'Justificado') {
    return {
      employee: { type: 'firmado', label: 'Firmado electrónicamente' },
      manager: { type: 'firmado', label: 'Firmado electrónicamente' },
      director: { type: 'firmado', label: 'Firmado electrónicamente' },
    };
  }
  // Pendiente
  return {
    employee: { type: 'firmado', label: 'Firmado electrónicamente' },
    manager: { type: 'pendiente', label: 'Pendiente de autorización' },
    director: { type: 'bloqueado', label: 'Esperando firma previa' },
  };
};

// ============== Signature Block ==============
const SignatureBlock = ({ title, name, state, timestamp }) => {
  const palette = {
    firmado: {
      ring: 'ring-emerald-200',
      bg: 'bg-emerald-50',
      icon: 'text-emerald-600 bg-emerald-100',
      badge: 'text-emerald-700',
      Icon: CheckCircle2,
      chip: 'FIRMADO',
      chipCls: 'bg-emerald-100 text-emerald-800',
    },
    pendiente: {
      ring: 'ring-amber-200',
      bg: 'bg-amber-50/60',
      icon: 'text-amber-600 bg-amber-100',
      badge: 'text-amber-700',
      Icon: Clock,
      chip: 'PENDIENTE',
      chipCls: 'bg-amber-100 text-amber-800',
    },
    bloqueado: {
      ring: 'ring-slate-200',
      bg: 'bg-slate-50',
      icon: 'text-slate-400 bg-slate-100',
      badge: 'text-slate-500',
      Icon: Lock,
      chip: 'BLOQUEADO',
      chipCls: 'bg-slate-100 text-slate-500',
    },
    rechazado: {
      ring: 'ring-rose-200',
      bg: 'bg-rose-50',
      icon: 'text-rose-600 bg-rose-100',
      badge: 'text-rose-700',
      Icon: XCircle,
      chip: 'RECHAZADO',
      chipCls: 'bg-rose-100 text-rose-800',
    },
  };
  const p = palette[state.type] || palette.bloqueado;
  const Icon = p.Icon;

  return (
    <div
      data-testid={`signature-block-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className={`rounded-2xl border border-slate-200 ${p.bg} px-5 py-5 flex flex-col items-center text-center min-h-[220px]`}
    >
      <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-slate-500 mb-4">
        {title}
      </p>
      <div className={`w-14 h-14 rounded-full ${p.icon} flex items-center justify-center mb-3 ring-4 ${p.ring}`}>
        <Icon className="w-7 h-7" />
      </div>
      {state.type === 'firmado' ? (
        <>
          <p className="text-sm font-bold text-slate-900">{name || '—'}</p>
          <p className="text-[11px] text-slate-500 italic mt-1">Firmado electrónicamente</p>
          {timestamp && <p className="text-[10px] text-slate-400 mt-0.5">{timestamp}</p>}
        </>
      ) : state.type === 'pendiente' ? (
        <>
          <p className={`text-xs font-bold uppercase tracking-wider ${p.badge} mb-2`}>PENDIENTE</p>
          <button
            type="button"
            data-testid={`signature-action-${title.toLowerCase().replace(/\s+/g, '-')}`}
            className="mt-1 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-800 print:hidden"
          >
            Firmar / Autorizar
          </button>
        </>
      ) : state.type === 'rechazado' ? (
        <>
          <p className="text-xs font-bold uppercase tracking-wider text-rose-700">RECHAZADO</p>
          <p className="text-[11px] text-slate-500 italic mt-1">Autorización denegada</p>
        </>
      ) : (
        <>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">BLOQUEADO</p>
          <p className="text-[11px] text-slate-400 italic mt-1">{state.label}</p>
        </>
      )}
      <div className="mt-auto pt-3 w-full border-t border-dashed border-slate-300">
        <p className="text-[9px] uppercase tracking-[0.14em] text-slate-400 font-medium">
          Nombre y firma
        </p>
      </div>
    </div>
  );
};

// ============== Main Document ==============
export const VacationDocument = ({ request, employee, onClose }) => {
  if (!request) return null;

  const flow = signatureFlow(request.status);
  const folio = buildFolio(request.id);
  const fechaEmision = todayShort();
  const reviewedAt = request.reviewedAt
    ? new Date(request.reviewedAt).toLocaleString('es-ES')
    : null;
  const createdAt = request.createdAt
    ? new Date(request.createdAt).toLocaleString('es-ES')
    : fechaEmision;

  const employeeName = request.employeeName || employee?.name || '—';
  const empDepartment = request.employeeDepartment || employee?.department || '—';
  const empPosition = employee?.position || employee?.role || '—';

  const handlePrint = () => window.print();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto print:bg-white print:static"
        data-testid="vacation-document-overlay"
      >
        {/* Top toolbar */}
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
                onClick={handlePrint}
                data-testid="doc-download-btn"
                className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
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

        {/* A4 paper */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="max-w-4xl mx-auto my-8 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-0 print:rounded-none print:my-0 print:max-w-none"
          id="vacation-document-paper"
        >
          <div className="px-10 py-10 print:px-12 print:py-10">
            {/* Header: logo + title */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b-2 border-slate-900 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-sm">
                  <Palmtree className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">WispHub</h1>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
                    Recursos Humanos
                  </p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  Formato de Vacaciones
                </h2>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <div className="border border-slate-200 rounded-lg px-3 py-1.5">
                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                      Fecha
                    </p>
                    <p className="text-xs font-semibold text-slate-900">{fechaEmision}</p>
                  </div>
                  <div className="border border-slate-200 rounded-lg px-3 py-1.5">
                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                      Folio
                    </p>
                    <p className="text-xs font-semibold text-slate-900">{folio}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Datos del empleado */}
            <section className="mt-8">
              <SectionTitle title="Datos del Empleado" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-3 border-b border-slate-100">
                <Field label="Nombre completo" value={employeeName} />
                <Field label="Área / Gerencia" value={empDepartment} />
                <Field label="Puesto" value={empPosition} />
              </div>
            </section>

            {/* Concepto de vacaciones */}
            <section className="mt-7">
              <SectionTitle title="Concepto de Vacaciones" />
              <div className="bg-slate-50/60 border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100/60">
                    <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3 font-semibold">Fecha Inicio</th>
                      <th className="px-5 py-3 font-semibold">Fecha Término</th>
                      <th className="px-5 py-3 font-semibold">Reincorporación</th>
                      <th className="px-5 py-3 font-semibold text-right">Días</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-200">
                      <td className="px-5 py-4 font-semibold text-slate-900">{fmtDate(request.startDate)}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{fmtDate(request.endDate)}</td>
                      <td className="px-5 py-4 font-semibold text-emerald-700">{fmtDate(request.returnDate)}</td>
                      <td className="px-5 py-4 text-right font-black text-slate-900">{request.totalDays}</td>
                    </tr>
                    <tr className="border-t border-slate-200 bg-white">
                      <td colSpan={3} className="px-5 py-3 text-right text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Total de días solicitados:
                      </td>
                      <td className="px-5 py-3 text-right text-lg font-black text-slate-900">
                        {request.totalDays}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {request.countWeekends && (
                <p className="text-[11px] text-slate-500 mt-2 italic">
                  * Incluye sábados y domingos en el conteo.
                </p>
              )}
            </section>

            {/* Observaciones */}
            <section className="mt-7">
              <SectionTitle title="Observaciones" />
              <div className="bg-slate-50/60 border border-slate-200 rounded-2xl px-5 py-4 min-h-[70px]">
                {request.reason ? (
                  <p className="text-sm text-slate-700 italic whitespace-pre-wrap">
                    {request.reason}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    Sin observaciones adicionales.
                  </p>
                )}
                {request.adminComment && (
                  <div className="mt-3 pt-3 border-t border-dashed border-slate-300">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
                      Nota administrativa
                    </p>
                    <p className="text-sm text-slate-700">{request.adminComment}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Flujo de Firmas */}
            <section className="mt-8">
              <SectionTitle title="Flujo de Firmas y Aprobaciones" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SignatureBlock
                  title="Empleado"
                  name={employeeName}
                  state={flow.employee}
                  timestamp={createdAt}
                />
                <SignatureBlock
                  title="Gerencia / Jefe Directo"
                  name={request.reviewedBy}
                  state={flow.manager}
                  timestamp={reviewedAt}
                />
                <SignatureBlock
                  title="Director General"
                  name={flow.director.type === 'firmado' ? request.reviewedBy : ''}
                  state={flow.director}
                  timestamp={flow.director.type === 'firmado' ? reviewedAt : null}
                />
              </div>
            </section>

            {/* Footer legal */}
            <footer className="mt-10 pt-5 border-t border-slate-200 text-center">
              <p className="text-[10px] text-slate-400 italic leading-relaxed max-w-2xl mx-auto">
                Este documento es una representación digital de la solicitud de vacaciones procesada a
                través del sistema WispHub. Las firmas contenidas en este formato han sido validadas
                mediante autenticación de usuario y registro de auditoría en sistema. WispHub ©{' '}
                {new Date().getFullYear()} · Sistema de Gestión de Recursos Humanos.
              </p>
            </footer>
          </div>
        </motion.div>

        {/* Print styles */}
        <style>{`
          @media print {
            @page { size: A4; margin: 12mm; }
            body { background: white !important; }
            .print\\:hidden { display: none !important; }
            #vacation-document-paper { box-shadow: none !important; border: 0 !important; border-radius: 0 !important; margin: 0 !important; max-width: 100% !important; }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

const SectionTitle = ({ title }) => (
  <div className="inline-flex items-center gap-2 mb-4 bg-slate-100 rounded-full px-4 py-1.5">
    <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
    <span className="text-[11px] uppercase tracking-[0.16em] font-bold text-slate-700">
      {title}
    </span>
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">{label}</p>
    <p className="text-base font-semibold text-slate-900 border-b border-slate-300 pb-1 mt-1">
      {value || '—'}
    </p>
  </div>
);

export default VacationDocument;
