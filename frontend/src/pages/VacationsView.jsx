import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Plus,
  Search,
  Filter,
  X,
  Trash2,
  Briefcase,
  Stethoscope,
  Coffee,
  Award,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  TrendingDown,
  Wallet,
  Save,
  Palmtree,
} from 'lucide-react';
import { vacationsAPI, employeesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// =============== Helpers ===============
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_ES[d.getMonth()]}, ${d.getFullYear()}`;
};

const todayISO = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

const countBusinessDays = (startISO, endISO) => {
  if (!startISO || !endISO) return 0;
  const s = new Date(startISO + 'T00:00:00');
  const e = new Date(endISO + 'T00:00:00');
  if (isNaN(s) || isNaN(e) || e < s) return 0;
  let days = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) days += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return days;
};

const STATUS_STYLE = {
  Pendiente: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  Aprobado: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Justificado: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Rechazado: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

const STATUS_DOT = {
  Pendiente: 'bg-slate-400',
  Aprobado: 'bg-blue-500',
  Justificado: 'bg-amber-500',
  Rechazado: 'bg-red-500',
};

const TYPE_META = {
  Vacaciones: { icon: Coffee, color: 'text-emerald-600 bg-emerald-50' },
  Enfermedad: { icon: Stethoscope, color: 'text-rose-600 bg-rose-50' },
  'Asuntos Propios': { icon: Briefcase, color: 'text-indigo-600 bg-indigo-50' },
  Compensatorio: { icon: Award, color: 'text-amber-600 bg-amber-50' },
};

// =============== Components ===============

const KpiCard = ({ icon: Icon, label, value, sub, accent = 'slate', trend }) => {
  const accents = {
    slate: 'from-slate-50 to-white text-slate-900 ring-slate-200',
    blue: 'from-blue-50 to-white text-blue-700 ring-blue-200',
    emerald: 'from-emerald-50 to-white text-emerald-700 ring-emerald-200',
    amber: 'from-amber-50 to-white text-amber-700 ring-amber-200',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`relative bg-gradient-to-br ${accents[accent]} rounded-2xl p-5 ring-1 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="text-xs font-medium text-slate-500 bg-white/70 rounded-full px-2 py-0.5">{trend}</span>
        )}
      </div>
      <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </motion.div>
  );
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[status] || STATUS_STYLE.Pendiente}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] || STATUS_DOT.Pendiente}`} />
    {status}
  </span>
);

const TypeChip = ({ type }) => {
  const meta = TYPE_META[type] || TYPE_META.Vacaciones;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${meta.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {type}
    </span>
  );
};

// =============== Drawer: New Request ===============

const RequestDrawer = ({ open, onClose, onSubmit, employees, isAdmin, currentEmployeeId, balance }) => {
  const [form, setForm] = useState({
    employeeId: currentEmployeeId || '',
    type: 'Vacaciones',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({
        employeeId: currentEmployeeId || '',
        type: 'Vacaciones',
        startDate: '',
        endDate: '',
        reason: '',
      });
      setError('');
    }
  }, [open, currentEmployeeId]);

  const totalDays = useMemo(
    () => countBusinessDays(form.startDate, form.endDate),
    [form.startDate, form.endDate]
  );

  const valid =
    form.startDate &&
    form.endDate &&
    form.startDate >= todayISO() &&
    form.endDate >= form.startDate &&
    totalDays > 0 &&
    (!isAdmin || form.employeeId);

  const consumesBalance = ['Vacaciones', 'Asuntos Propios', 'Compensatorio'].includes(form.type);

  const handleSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        employeeId: isAdmin ? form.employeeId : undefined,
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });
      onClose();
    } catch (e) {
      setError(e.message || 'Error al crear solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Nueva solicitud</h3>
                <p className="text-xs text-slate-500">Solicita días de ausencia</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {isAdmin && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Empleado</label>
                  <select
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">— Selecciona —</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} · {e.department}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(TYPE_META).map((t) => {
                    const meta = TYPE_META[t];
                    const Icon = meta.icon;
                    const active = form.type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, type: t })}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-all ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Desde</label>
                  <input
                    type="date"
                    min={todayISO()}
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Hasta</label>
                  <input
                    type="date"
                    min={form.startDate || todayISO()}
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Resumen dinámico */}
              <motion.div
                key={`${form.startDate}-${form.endDate}-${form.type}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 rounded-2xl p-4 ring-1 ring-slate-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-slate-700" />
                    <p className="text-sm font-medium text-slate-700">Resumen</p>
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{totalDays}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {totalDays === 1 ? 'día laborable' : 'días laborables'} solicitados
                  {consumesBalance ? ' · resta del saldo' : ' · no resta del saldo'}
                </p>
                {!isAdmin && balance && consumesBalance && (
                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Disponibles tras solicitud</span>
                    <span
                      className={`font-semibold ${
                        balance.daysAvailable - totalDays < 0 ? 'text-red-600' : 'text-slate-900'
                      }`}
                    >
                      {Math.max(balance.daysAvailable - totalDays, 0)} / {balance.totalDays}
                    </span>
                  </div>
                )}
              </motion.div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Motivo</label>
                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Describe brevemente el motivo de tu solicitud…"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-4 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!valid || submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
              >
                {submitting ? 'Enviando…' : 'Enviar solicitud'}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

// =============== Drawer: Review (Admin) - REPLACED BY EditRequestModal ===============

// =============== Calendar (multi-day select) ===============

const Calendar360 = ({ value = [], onChange, countWeekends = false, monthOffset = 0 }) => {
  // value: array of ISO dates "YYYY-MM-DD"
  const [viewMonth, setViewMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth() + monthOffset, 1);
  });

  const monthLabel = useMemo(() => {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${months[viewMonth.getMonth()]} de ${viewMonth.getFullYear()}`;
  }, [viewMonth]);

  const grid = useMemo(() => {
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    const firstDow = new Date(y, m, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);

  const toIso = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const isSelected = (d) => value.includes(toIso(d));
  const isWeekend = (d) => {
    const dow = d.getDay();
    return dow === 0 || dow === 6;
  };
  const isPast = (d) => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d < t;
  };

  const toggle = (d) => {
    if (isPast(d)) return;
    if (!countWeekends && isWeekend(d)) return;
    const iso = toIso(d);
    if (value.includes(iso)) {
      onChange(value.filter((v) => v !== iso));
    } else {
      onChange([...value, iso].sort());
    }
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-4 ring-1 ring-slate-200/70">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() =>
            setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
          }
          className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-slate-500"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-slate-700 capitalize">{monthLabel}</span>
        <button
          type="button"
          onClick={() =>
            setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
          }
          className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-slate-500"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
          <div key={i} className="text-[10px] text-center text-slate-400 font-medium uppercase">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((d, idx) => {
          if (!d) return <div key={idx} className="h-9" />;
          const sel = isSelected(d);
          const past = isPast(d);
          const we = isWeekend(d);
          const disabled = past || (!countWeekends && we);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => toggle(d)}
              disabled={disabled}
              className={`h-9 rounded-lg text-xs font-medium transition-all ${
                sel
                  ? 'bg-slate-900 text-white shadow-sm'
                  : disabled
                  ? we
                    ? 'text-rose-400 cursor-not-allowed'
                    : 'text-slate-300 cursor-not-allowed'
                  : we
                  ? 'text-rose-500 hover:bg-rose-50'
                  : 'text-slate-700 hover:bg-white hover:shadow-sm'
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center gap-4 text-[10px] text-slate-500 uppercase font-medium tracking-wider">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" /> Fines de semana
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-900" /> Seleccionado
        </span>
      </div>
    </div>
  );
};

// =============== Edit Request Modal (Admin) ===============

const buildSelectedDaysFromRange = (startIso, endIso, countWeekends) => {
  if (!startIso || !endIso) return [];
  const s = new Date(startIso + 'T00:00:00');
  const e = new Date(endIso + 'T00:00:00');
  if (isNaN(s) || isNaN(e) || e < s) return [];
  const out = [];
  const cur = new Date(s);
  while (cur <= e) {
    const dow = cur.getDay();
    if (countWeekends || (dow !== 0 && dow !== 6)) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      out.push(`${y}-${m}-${d}`);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return out;
};

const computeReturnDate = (lastIso) => {
  if (!lastIso) return null;
  const d = new Date(lastIso + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const EditRequestModal = ({ request, balance, onClose, onSave }) => {
  const [days, setDays] = useState([]);
  const [countWeekends, setCountWeekends] = useState(false);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('Pendiente');
  const [reason, setReason] = useState('');
  const [type, setType] = useState('Vacaciones');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!request) return;
    const cw = !!request.countWeekends;
    setCountWeekends(cw);
    let initial = request.selectedDays;
    if (!initial || initial.length === 0) {
      initial = buildSelectedDaysFromRange(request.startDate, request.endDate, cw);
    }
    setDays(initial);
    setComment(request.adminComment || '');
    setStatus(request.status || 'Pendiente');
    setReason(request.reason || '');
    setType(request.type || 'Vacaciones');
    setError('');
  }, [request?.id]);

  const sortedDays = useMemo(() => [...days].sort(), [days]);
  const totalDays = useMemo(() => {
    if (countWeekends) return sortedDays.length;
    return sortedDays.filter((iso) => {
      const d = new Date(iso + 'T00:00:00');
      const dow = d.getDay();
      return dow !== 0 && dow !== 6;
    }).length;
  }, [sortedDays, countWeekends]);

  const startDate = sortedDays[0] || null;
  const endDate = sortedDays[sortedDays.length - 1] || null;
  const returnDate = endDate ? computeReturnDate(endDate) : null;

  const consumesBalance = ['Vacaciones', 'Asuntos Propios', 'Compensatorio'].includes(type);

  const totalBalance = balance?.totalDays ?? 12;
  const usedBalance = balance?.daysUsed ?? 0;
  const availableBalance = balance?.daysAvailable ?? totalBalance;
  // restante hipotético tras esta solicitud (si Aprobado y consume)
  const remainingAfter = consumesBalance
    ? Math.max(availableBalance - totalDays, 0)
    : availableBalance;

  const handleSave = async () => {
    setError('');
    if (sortedDays.length === 0) {
      setError('Selecciona al menos un día');
      return;
    }
    setSaving(true);
    try {
      await onSave(request.id, {
        type,
        selectedDays: sortedDays,
        countWeekends,
        status,
        adminComment: comment,
        reason,
      });
      onClose();
    } catch (e) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const STATUS_OPTIONS = [
    { value: 'Pendiente', label: 'Pendiente', cls: 'bg-amber-500 text-white' },
    { value: 'Aprobado', label: 'Aprobado', cls: 'bg-blue-600 text-white' },
    { value: 'Justificado', label: 'Justificado', cls: 'bg-amber-100 text-amber-800' },
    { value: 'Rechazado', label: 'Rechazado', cls: 'bg-red-600 text-white' },
  ];

  if (!request) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Palmtree className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Editar Solicitud</h3>
                <p className="text-xs text-slate-500">Revisa y ajusta los datos</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-7">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT COLUMN */}
              <div className="space-y-5">
                {/* Empleado */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                    Empleado
                  </label>
                  <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/50">
                    <img
                      src={request.employeeAvatar}
                      alt={request.employeeName}
                      className="w-9 h-9 rounded-full bg-white ring-1 ring-slate-200"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{request.employeeName}</p>
                      <p className="text-xs text-slate-500">{request.employeeDepartment}</p>
                    </div>
                  </div>
                </div>

                {/* Bolsa de vacaciones */}
                <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Bolsa de Vacaciones
                    </h4>
                    <span className="text-[11px] text-slate-500">Año {new Date().getFullYear()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{totalBalance}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Usados</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{usedBalance}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Disponibles</p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">{availableBalance}</p>
                    </div>
                  </div>
                  <div className="border-t border-dashed border-slate-200 mt-4 pt-3 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                      Restante tras solicitud:
                    </span>
                    <motion.span
                      key={remainingAfter}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-lg font-bold ${
                        remainingAfter < 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {remainingAfter} días
                    </motion.span>
                  </div>
                </div>

                {/* Selector de días */}
                <div>
                  <label className="flex items-center justify-between mb-2">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                      Seleccionar días
                    </span>
                  </label>
                  <Calendar360
                    value={sortedDays}
                    onChange={setDays}
                    countWeekends={countWeekends}
                  />
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-5">
                {/* Resumen de periodo */}
                <div className="rounded-2xl bg-slate-50/60 border border-slate-200 p-5">
                  <h4 className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-4">
                    Resumen de Periodo
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Inicio</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{startDate || '—'}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Fin</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{endDate || '—'}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                        Reincorporación
                      </p>
                      <p className="text-sm font-bold text-emerald-600 mt-0.5">{returnDate || '—'}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                        Días Totales
                      </p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{totalDays} días</p>
                    </div>
                  </div>

                  <label className="mt-4 flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={countWeekends}
                      onChange={(e) => setCountWeekends(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-sm text-slate-700">Contar sábados y domingos</span>
                  </label>
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                    Tipo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(TYPE_META).map((t) => {
                      const meta = TYPE_META[t];
                      const Icon = meta.icon;
                      const active = type === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                            active
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comentarios */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                    Comentarios
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Añade una nota administrativa…"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                    Estado
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((opt) => {
                      const active = status === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setStatus(opt.value)}
                          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                            active
                              ? opt.cls + ' shadow-sm'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-7 py-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || sortedDays.length === 0}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando…' : 'Guardar Cambios'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// =============== Main View ===============

const VacationsView = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [balances, setBalances] = useState([]);
  const [myBalance, setMyBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reviewing, setReviewing] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reqs, emps] = await Promise.all([
        vacationsAPI.list({ status: filterStatus, search }),
        isAdmin ? employeesAPI.getAll() : Promise.resolve([]),
      ]);
      setRequests(reqs);
      setEmployees(emps);

      if (isAdmin) {
        const bs = await vacationsAPI.balances();
        setBalances(bs);
      } else {
        try {
          const bal = await vacationsAPI.myBalance();
          setMyBalance(bal);
        } catch (err) {
          console.warn('No balance for user', err);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, [filterStatus, search]);

  // KPI calc
  const kpi = useMemo(() => {
    if (isAdmin) {
      const totalAvailable = balances.reduce((a, b) => a + (b.daysAvailable || 0), 0);
      const totalUsed = balances.reduce((a, b) => a + (b.daysUsed || 0), 0);
      const pending = requests.filter((r) => r.status === 'Pendiente').length;
      return {
        availableLabel: 'Días Disponibles (equipo)',
        availableValue: totalAvailable,
        availableSub: `${balances.length} empleados`,
        usedValue: totalUsed,
        pendingValue: pending,
      };
    }
    const totalDays = myBalance?.totalDays ?? 12;
    const used = myBalance?.daysUsed ?? 0;
    const pending = requests.filter((r) => r.status === 'Pendiente').length;
    return {
      availableLabel: 'Días Disponibles',
      availableValue: myBalance?.daysAvailable ?? totalDays,
      availableSub: `de ${totalDays} anuales`,
      usedValue: used,
      pendingValue: pending,
    };
  }, [requests, balances, myBalance, isAdmin]);

  // filtros
  const filteredRequests = requests; // backend ya filtró

  const handleCreate = async (data) => {
    await vacationsAPI.create(data);
    await fetchAll();
  };

  const handleAction = async (id, payload) => {
    await vacationsAPI.updateStatus(id, payload);
    await fetchAll();
  };

  const handleSaveEdit = async (id, payload) => {
    await vacationsAPI.update(id, payload);
    await fetchAll();
  };

  const reviewingBalance = useMemo(() => {
    if (!reviewing) return null;
    return balances.find((b) => b.employeeId === reviewing.employeeId) || null;
  }, [reviewing, balances]);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Cancelar esta solicitud?')) return;
    await vacationsAPI.delete(id);
    await fetchAll();
  };

  const STATUS_TABS = ['all', 'Pendiente', 'Aprobado', 'Justificado', 'Rechazado'];
  const STATUS_LABEL = { all: 'Todas' };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit' }}>
            Vacaciones y Ausencias
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'Gestiona las solicitudes de tu equipo y aprueba o rechaza ausencias.'
              : 'Solicita días libres y consulta el estado de tus ausencias.'}
          </p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva solicitud
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          icon={Wallet}
          label={kpi.availableLabel}
          value={kpi.availableValue}
          sub={kpi.availableSub}
          accent="emerald"
        />
        <KpiCard
          icon={TrendingDown}
          label="Días Consumidos"
          value={kpi.usedValue}
          sub={isAdmin ? 'Total acumulado del equipo' : 'Aprobados este año'}
          accent="blue"
        />
        <KpiCard
          icon={Clock}
          label="Solicitudes en Revisión"
          value={kpi.pendingValue}
          sub="Pendientes de aprobación"
          accent="amber"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <Filter className="w-4 h-4" />
            Filtros:
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((s) => (
              <motion.button
                key={s}
                onClick={() => setFilterStatus(s)}
                whileTap={{ scale: 0.96 }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterStatus === s
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {STATUS_LABEL[s] || s}
              </motion.button>
            ))}
          </div>

          <div className="flex-1" />

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar empleado…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full lg:w-64 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-medium">Empleado</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Desde</th>
                <th className="px-5 py-3 font-medium">Hasta</th>
                <th className="px-5 py-3 font-medium">Días</th>
                <th className="px-5 py-3 font-medium">Regreso</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 text-sm">
                    Cargando solicitudes…
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 text-sm">
                    No hay solicitudes que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {filteredRequests.map((r, idx) => (
                    <motion.tr
                      key={r.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, delay: Math.min(idx * 0.025, 0.2) }}
                      className="hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={r.employeeAvatar}
                            alt={r.employeeName}
                            className="w-9 h-9 rounded-full bg-slate-100 ring-1 ring-slate-200"
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{r.employeeName}</p>
                            <p className="text-xs text-slate-500">{r.employeeDepartment}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <TypeChip type={r.type} />
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-700 whitespace-nowrap">
                        {formatDate(r.startDate)}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-700 whitespace-nowrap">
                        {formatDate(r.endDate)}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">{r.totalDays}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                        {formatDate(r.returnDate)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAdmin && r.status === 'Pendiente' && (
                            <button
                              onClick={() => setReviewing(r)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                            >
                              Revisar
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && r.status !== 'Pendiente' && (
                            <button
                              onClick={() => setReviewing(r)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
                            >
                              Detalle
                            </button>
                          )}
                          {!isAdmin && r.status === 'Pendiente' && (
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Cancelar solicitud"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin: balance summary */}
      {isAdmin && balances.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Saldos por empleado</h3>
            <span className="text-xs text-slate-500">Año {new Date().getFullYear()}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/70 border-b border-slate-100">
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-medium">Empleado</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Consumidos</th>
                  <th className="px-5 py-3 font-medium">Pendientes</th>
                  <th className="px-5 py-3 font-medium">Disponibles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {balances.map((b) => (
                  <tr key={b.employeeId} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={b.employeeAvatar}
                          alt={b.employeeName}
                          className="w-8 h-8 rounded-full bg-slate-100"
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{b.employeeName}</p>
                          <p className="text-xs text-slate-500">{b.employeeDepartment}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-900">{b.totalDays}</td>
                    <td className="px-5 py-3 text-sm text-blue-700">{b.daysUsed}</td>
                    <td className="px-5 py-3 text-sm text-amber-700">{b.daysPending}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          b.daysAvailable <= 2
                            ? 'bg-red-50 text-red-700'
                            : b.daysAvailable <= 5
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {b.daysAvailable}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <RequestDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleCreate}
        employees={employees}
        isAdmin={isAdmin}
        currentEmployeeId={user?.employee_id}
        balance={myBalance}
      />

      {reviewing && (
        <EditRequestModal
          request={reviewing}
          balance={reviewingBalance}
          onClose={() => setReviewing(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default VacationsView;
