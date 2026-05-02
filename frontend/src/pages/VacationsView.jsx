import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck2,
  FileText,
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
  AlertTriangle,
  TrendingDown,
  Wallet,
  Save,
  Palmtree,
  PartyPopper,
  Pencil,
  Settings,
  ListChecks,
  Shield,
  Sparkles,
  Bell,
  CalendarClock,
  CalendarRange,
  RefreshCw,
  ArrowUpRight,
  Wallet as WalletIcon,
} from 'lucide-react';
import { vacationsAPI, employeesAPI, vacationPoliciesAPI, vacationHolidaysAPI, vacationSuggestedAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import VacationDocument from '../components/VacationDocument';

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
  Pendiente: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Aprobado: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Justificado: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Rechazado: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

const STATUS_DOT = {
  Pendiente: 'bg-amber-500',
  Aprobado: 'bg-emerald-500',
  Justificado: 'bg-blue-500',
  Rechazado: 'bg-red-500',
};

// Genera un código corto tipo EMP-001 a partir del id UUID del empleado
const empCode = (id) => {
  if (!id) return 'EMP-000';
  const short = String(id).replace(/-/g, '').slice(-3).toUpperCase();
  return `EMP-${short}`;
};

// Color usage scale (verde → ámbar → naranja → rojo) según porcentaje consumido
const usageColor = (pct) => {
  if (pct >= 90) return { bar: 'from-red-500 to-red-600', ring: 'ring-red-200', chip: 'bg-red-50 text-red-700', icon: 'text-red-600' };
  if (pct >= 70) return { bar: 'from-orange-500 to-red-500', ring: 'ring-orange-200', chip: 'bg-orange-50 text-orange-700', icon: 'text-orange-600' };
  if (pct >= 40) return { bar: 'from-amber-400 to-orange-500', ring: 'ring-amber-200', chip: 'bg-amber-50 text-amber-700', icon: 'text-amber-600' };
  if (pct >= 20) return { bar: 'from-emerald-400 to-amber-400', ring: 'ring-emerald-200', chip: 'bg-emerald-50 text-emerald-700', icon: 'text-emerald-600' };
  return { bar: 'from-emerald-400 to-emerald-600', ring: 'ring-emerald-200', chip: 'bg-emerald-50 text-emerald-700', icon: 'text-emerald-600' };
};

// Paleta por "madurez" para políticas de antigüedad
const maturityPalette = (yearsFrom) => {
  if (yearsFrom >= 10) return {
    from: 'from-amber-200', to: 'to-yellow-50', ring: 'ring-amber-200',
    icon: 'bg-amber-100 text-amber-700', accent: 'text-amber-700', label: 'Senior / Veterano',
    barFrom: 'from-amber-400', barTo: 'to-yellow-500',
  };
  if (yearsFrom >= 5) return {
    from: 'from-purple-100', to: 'to-pink-50', ring: 'ring-purple-200',
    icon: 'bg-purple-100 text-purple-700', accent: 'text-purple-700', label: 'Experimentado',
    barFrom: 'from-purple-400', barTo: 'to-pink-400',
  };
  if (yearsFrom >= 3) return {
    from: 'from-indigo-100', to: 'to-blue-50', ring: 'ring-indigo-200',
    icon: 'bg-indigo-100 text-indigo-700', accent: 'text-indigo-700', label: 'Consolidado',
    barFrom: 'from-indigo-400', barTo: 'to-blue-400',
  };
  if (yearsFrom >= 1) return {
    from: 'from-blue-100', to: 'to-cyan-50', ring: 'ring-blue-200',
    icon: 'bg-blue-100 text-blue-700', accent: 'text-blue-700', label: 'En desarrollo',
    barFrom: 'from-blue-400', barTo: 'to-cyan-400',
  };
  return {
    from: 'from-emerald-100', to: 'to-lime-50', ring: 'ring-emerald-200',
    icon: 'bg-emerald-100 text-emerald-700', accent: 'text-emerald-700', label: 'Nuevo / Junior',
    barFrom: 'from-emerald-400', barTo: 'to-lime-400',
  };
};

// --- Renewal prediction (a partir de hireDate) ---
const computeRenewal = (hireDateISO) => {
  if (!hireDateISO) return null;
  const hire = new Date(hireDateISO + 'T00:00:00');
  if (isNaN(hire)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(today.getFullYear(), hire.getMonth(), hire.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, hire.getMonth(), hire.getDate());
  const diffMs = next - today;
  const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const iso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
  return { days, date: iso };
};

const renewalLevel = (days) => {
  if (days == null) return 'none';
  if (days <= 30) return 'urgent';
  if (days <= 60) return 'soon';
  if (days <= 90) return 'upcoming';
  return 'far';
};

const renewalStyle = (level) => {
  switch (level) {
    case 'urgent':
      return { chip: 'bg-red-100 text-red-700 ring-1 ring-red-200', dot: 'bg-red-500', icon: 'text-red-600', label: 'Urgente' };
    case 'soon':
      return { chip: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200', dot: 'bg-amber-500', icon: 'text-amber-600', label: 'Próxima' };
    case 'upcoming':
      return { chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', dot: 'bg-blue-500', icon: 'text-blue-600', label: 'Cercana' };
    case 'far':
      return { chip: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200', dot: 'bg-slate-400', icon: 'text-slate-500', label: 'Lejana' };
    default:
      return { chip: 'bg-slate-100 text-slate-500', dot: 'bg-slate-300', icon: 'text-slate-400', label: '—' };
  }
};

// Semáforo de progreso (verde → amarillo → naranja → rojo) según % consumido
const semaphoreBar = (pct) => {
  if (pct >= 90) return { bar: 'from-red-500 to-red-600', text: 'text-red-700' };
  if (pct >= 70) return { bar: 'from-orange-400 to-red-500', text: 'text-orange-700' };
  if (pct >= 50) return { bar: 'from-yellow-400 to-orange-400', text: 'text-yellow-700' };
  if (pct >= 25) return { bar: 'from-lime-400 to-yellow-400', text: 'text-lime-700' };
  return { bar: 'from-emerald-400 to-lime-400', text: 'text-emerald-700' };
};

const TYPE_META = {
  Vacaciones: { icon: Coffee, color: 'text-emerald-600 bg-emerald-50' },
  Otro: { icon: FileText, color: 'text-slate-600 bg-slate-100' },
  // Legacy types (mantener para retrocompatibilidad de solicitudes antiguas)
  Enfermedad: { icon: Stethoscope, color: 'text-rose-600 bg-rose-50' },
  'Asuntos Propios': { icon: Briefcase, color: 'text-indigo-600 bg-indigo-50' },
  Compensatorio: { icon: Award, color: 'text-amber-600 bg-amber-50' },
};

// Tipos disponibles para crear/editar (los legacy ya no se ofrecen)
const ACTIVE_TYPES = ['Vacaciones', 'Otro'];

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

// =============== Modal: New Request ===============

const RequestModal = ({ open, onClose, onSubmit, employees, isAdmin, currentEmployeeId, balance, balances = [], holidays, suggestedRanges = [] }) => {
  const [form, setForm] = useState({
    employeeId: currentEmployeeId || '',
    type: 'Vacaciones',
    selectedDays: [],
    countWeekends: false,
    deductsBalance: true,
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [limitWarning, setLimitWarning] = useState('');
  const [suggestedId, setSuggestedId] = useState('');

  useEffect(() => {
    if (open) {
      setForm({
        employeeId: currentEmployeeId || '',
        type: 'Vacaciones',
        selectedDays: [],
        countWeekends: false,
        deductsBalance: true,
        reason: '',
      });
      setError('');
      setLimitWarning('');
      setSuggestedId('');
    }
  }, [open, currentEmployeeId]);

  const sortedDays = useMemo(() => [...form.selectedDays].sort(), [form.selectedDays]);

  const totalDays = useMemo(() => {
    if (form.countWeekends) return sortedDays.length;
    return sortedDays.filter((iso) => {
      const d = new Date(iso + 'T00:00:00');
      const dow = d.getDay();
      return dow !== 0 && dow !== 6;
    }).length;
  }, [sortedDays, form.countWeekends]);

  const startDate = sortedDays[0] || null;
  const endDate = sortedDays[sortedDays.length - 1] || null;
  const returnDate = endDate ? computeReturnDate(endDate) : null;

  const valid =
    sortedDays.length > 0 &&
    totalDays > 0 &&
    (!isAdmin || form.employeeId) &&
    (form.type !== 'Otro' || (form.reason && form.reason.trim().length > 0));

  const consumesBalance = !!form.deductsBalance;

  // Determinar la bolsa efectiva: empleado usa su prop balance; admin busca en `balances` según empleado seleccionado
  const effectiveBalance = useMemo(() => {
    if (isAdmin) {
      if (!form.employeeId) return null;
      return balances.find((b) => b.employeeId === form.employeeId) || null;
    }
    return balance || null;
  }, [isAdmin, form.employeeId, balances, balance]);

  const availableDays = effectiveBalance
    ? Math.max((effectiveBalance.daysAvailable ?? 0) - (effectiveBalance.daysPending ?? 0), 0)
    : null;
  const exceedsBalance = consumesBalance && availableDays != null && totalDays > availableDays;

  // Calcula días laborables (o totales si countWeekends) de un array de ISOs
  const computeBusinessDaysFromArr = (arr, cw) => {
    if (cw) return arr.length;
    return arr.filter((iso) => {
      const d = new Date(iso + 'T00:00:00');
      const dow = d.getDay();
      return dow !== 0 && dow !== 6;
    }).length;
  };

  // Wrapper para Calendar360.onChange que valida el límite de bolsa
  const handleCalendarChange = (newDays) => {
    setLimitWarning('');
    if (consumesBalance && availableDays != null) {
      const projected = computeBusinessDaysFromArr(newDays, form.countWeekends);
      // Solo bloquear cuando se intente AÑADIR (no al deseleccionar)
      const isAdding = newDays.length > form.selectedDays.length;
      if (isAdding && projected > availableDays) {
        setLimitWarning(
          `No puedes seleccionar más días: solo tienes ${availableDays} día${
            availableDays === 1 ? '' : 's'
          } disponible${availableDays === 1 ? '' : 's'} en tu bolsa.`
        );
        return; // bloquea la selección
      }
    }
    setForm({ ...form, selectedDays: newDays });
  };

  // Si cambia tipo, deductsBalance o countWeekends, recalcular si la selección actual sobrepasa
  useEffect(() => {
    if (consumesBalance && availableDays != null && totalDays > availableDays) {
      setLimitWarning(
        `Tu selección (${totalDays}) supera tu bolsa disponible (${availableDays}). Ajusta los días.`
      );
    } else {
      setLimitWarning('');
    }
    // eslint-disable-next-line
  }, [form.type, form.deductsBalance, form.countWeekends, form.employeeId]);

  const handleSubmit = async () => {
    if (!valid) return;
    if (exceedsBalance) {
      setError(
        `No puedes enviar la solicitud: superas tu bolsa disponible (${availableDays} días).`
      );
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        employeeId: isAdmin ? form.employeeId : undefined,
        type: form.type,
        selectedDays: sortedDays,
        countWeekends: form.countWeekends,
        deductsBalance: form.deductsBalance,
        startDate: startDate,
        endDate: endDate,
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
            data-testid="new-request-modal"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Palmtree className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Nueva solicitud</h3>
                  <p className="text-xs text-slate-500">Selecciona los días en el calendario</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg" data-testid="new-request-close">
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
                  {ACTIVE_TYPES.map((t) => {
                    const meta = TYPE_META[t];
                    const Icon = meta.icon;
                    const active = form.type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          // Al cambiar a "Otro" desactivamos el descuento por defecto.
                          // Al cambiar a "Vacaciones" lo activamos.
                          setForm({
                            ...form,
                            type: t,
                            deductsBalance: t === 'Vacaciones',
                          });
                        }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-all ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                        data-testid={`type-${t.toLowerCase()}`}
                      >
                        <Icon className="w-4 h-4" />
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Razón / motivo */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Motivo {form.type === 'Otro' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder={
                    form.type === 'Otro'
                      ? 'Describe el motivo (ej: enfermedad, cita médica, asunto personal…)'
                      : 'Describe brevemente el motivo de tu solicitud (opcional)'
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                  data-testid="reason-input"
                />
              </div>

              {/* Descuento de bolsa - solo visible para tipo "Otro" */}
              {form.type === 'Otro' && (
                <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 ring-1 ring-slate-200 cursor-pointer select-none hover:bg-slate-100/70 transition">
                  <input
                    type="checkbox"
                    checked={!!form.deductsBalance}
                    onChange={(e) => setForm({ ...form, deductsBalance: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    data-testid="deducts-balance-checkbox"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      Descontar estos días de mi bolsa de vacaciones
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {form.deductsBalance
                        ? 'Los días aprobados restarán del saldo disponible.'
                        : 'Los días aprobados NO afectarán tu saldo (ej. justificación, comisión).'}
                    </p>
                  </div>
                </label>
              )}

              {/* Rangos Sugeridos */}
              {suggestedRanges.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Vacaciones sugeridas (opcional)
                  </label>
                  <select
                    value={suggestedId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSuggestedId(id);
                      if (!id) {
                        // Deseleccionar limpia el calendario
                        handleCalendarChange([]);
                        return;
                      }
                      const rng = suggestedRanges.find((r) => r.id === id);
                      if (!rng) return;
                      const days = buildSelectedDaysFromRange(rng.startDate, rng.endDate, form.countWeekends);
                      handleCalendarChange(days);
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    data-testid="suggested-range-select"
                  >
                    <option value="">— Elige un rango preconfigurado —</option>
                    {suggestedRanges.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} · {r.startDate} → {r.endDate}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Al elegir un rango, se auto-seleccionan los días en el calendario.
                  </p>
                </div>
              )}

              {/* Calendario */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Selecciona los días</label>
                {consumesBalance && availableDays != null && (
                  <div className="mb-2 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs">
                    <span className="text-emerald-700 font-medium">
                      Bolsa disponible: <span className="font-bold">{availableDays}</span> día{availableDays === 1 ? '' : 's'}
                    </span>
                    <span className="text-slate-600">
                      Seleccionados: <span className="font-bold text-slate-900">{totalDays}</span>
                    </span>
                  </div>
                )}
                <Calendar360
                  value={sortedDays}
                  onChange={(days) => {
                    setSuggestedId(''); // edición manual desvincula el rango aplicado
                    handleCalendarChange(days);
                  }}
                  countWeekends={form.countWeekends}
                  holidays={holidays}
                />
                {limitWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2 text-xs flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{limitWarning}</span>
                  </motion.div>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.countWeekends}
                  onChange={(e) => setForm({ ...form, countWeekends: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-sm text-slate-700">Contar sábados y domingos</span>
              </label>

              {/* Resumen dinámico */}
              <motion.div
                key={`${startDate}-${endDate}-${form.type}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 rounded-2xl p-4 ring-1 ring-slate-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-slate-700" />
                    <p className="text-sm font-medium text-slate-700">Resumen</p>
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{totalDays}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">Inicio</p>
                    <p className="font-semibold text-slate-900">{startDate || '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Fin</p>
                    <p className="font-semibold text-slate-900">{endDate || '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Reincorp.</p>
                    <p className="font-semibold text-emerald-600">{returnDate || '—'}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {totalDays === 1 ? 'día laborable' : 'días laborables'}
                  {consumesBalance ? ' · resta del saldo' : ' · no resta del saldo'}
                </p>
                {effectiveBalance && consumesBalance && (
                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Disponibles tras solicitud</span>
                    <span
                      className={`font-semibold ${
                        effectiveBalance.daysAvailable - totalDays < 0 ? 'text-red-600' : 'text-slate-900'
                      }`}
                    >
                      {Math.max(effectiveBalance.daysAvailable - totalDays, 0)} / {effectiveBalance.totalDays}
                    </span>
                  </div>
                )}
              </motion.div>

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
                data-testid="new-request-cancel"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!valid || submitting || exceedsBalance}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                data-testid="new-request-submit"
              >
                {submitting ? 'Enviando…' : exceedsBalance ? 'Sin saldo suficiente' : 'Enviar solicitud'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// =============== Drawer: Review (Admin) - REPLACED BY EditRequestModal ===============

// =============== Calendar (multi-day select) ===============

const Calendar360 = ({ value = [], onChange, countWeekends = false, monthOffset = 0, holidays = [] }) => {
  // value: array of ISO dates "YYYY-MM-DD"
  // holidays: array of objects with {date: ISO, name, recurring}
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

  // Set de fechas festivas para el año mostrado (incluye recurring por mm-dd)
  const holidaySet = useMemo(() => {
    const y = viewMonth.getFullYear();
    const set = new Map();
    (holidays || []).forEach((h) => {
      const d = new Date(h.date + 'T00:00:00');
      if (isNaN(d)) return;
      if (h.recurring) {
        const key = `${y}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        set.set(key, h.name);
      } else if (d.getFullYear() === y) {
        const key = h.date;
        set.set(key, h.name);
      }
    });
    return set;
  }, [holidays, viewMonth]);

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
  const isHoliday = (d) => holidaySet.has(toIso(d));
  const holidayName = (d) => holidaySet.get(toIso(d));
  const isPast = (d) => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d < t;
  };

  const toggle = (d) => {
    if (isPast(d)) return;
    if (!countWeekends && isWeekend(d)) return;
    if (isHoliday(d)) return; // festivos no son seleccionables
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
          const hol = isHoliday(d);
          const disabled = past || hol || (!countWeekends && we);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => toggle(d)}
              disabled={disabled}
              title={hol ? holidayName(d) : ''}
              className={`h-9 rounded-lg text-xs font-medium transition-all relative ${
                sel
                  ? 'bg-slate-900 text-white shadow-sm'
                  : hol
                  ? 'bg-orange-100 text-orange-700 cursor-not-allowed'
                  : past
                  ? we
                    ? 'text-rose-300 cursor-not-allowed'
                    : 'text-slate-300 cursor-not-allowed'
                  : we
                  ? !countWeekends
                    ? 'text-rose-500 cursor-not-allowed'
                    : 'text-rose-500 hover:bg-rose-50'
                  : 'text-slate-700 hover:bg-white hover:shadow-sm'
              }`}
            >
              {d.getDate()}
              {hol && !sel && (
                <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-orange-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center gap-4 text-[10px] text-slate-500 uppercase font-medium tracking-wider flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" /> Fines de semana
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500" /> Festivos
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

const EditRequestModal = ({ request, balance, holidays = [], onClose, onSave }) => {
  const [days, setDays] = useState([]);
  const [countWeekends, setCountWeekends] = useState(false);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('Pendiente');
  const [reason, setReason] = useState('');
  const [type, setType] = useState('Vacaciones');
  const [deductsBalance, setDeductsBalance] = useState(true);
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
    // Si el tipo es legacy, lo mapeamos a "Otro" para edición. Vacaciones se mantiene.
    const t = request.type === 'Vacaciones' ? 'Vacaciones' : (request.type === 'Otro' ? 'Otro' : 'Otro');
    setType(t);
    // deductsBalance: si viene explícito úsalo; si no, dedúcelo del tipo legacy
    if (request.deductsBalance != null) {
      setDeductsBalance(!!request.deductsBalance);
    } else {
      setDeductsBalance(['Vacaciones', 'Asuntos Propios', 'Compensatorio'].includes(request.type));
    }
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

  const consumesBalance = !!deductsBalance;

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
        deductsBalance,
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
                  {balance?.seniorityYears != null && (
                    <div className="border-t border-dashed border-slate-200 mt-4 pt-3 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Antigüedad:
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {Math.floor(balance.seniorityYears)} años
                        {balance?.hireDate && (
                          <span className="ml-2 text-[11px] font-medium text-slate-500">
                            (desde {balance.hireDate})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-dashed border-slate-200 mt-3 pt-3 flex items-center justify-between">
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
                    holidays={holidays}
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
                    {ACTIVE_TYPES.map((t) => {
                      const meta = TYPE_META[t];
                      const Icon = meta.icon;
                      const active = type === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setType(t);
                            setDeductsBalance(t === 'Vacaciones');
                          }}
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

                {/* Descuento de bolsa - solo visible para tipo "Otro" */}
                {type === 'Otro' && (
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 ring-1 ring-slate-200 cursor-pointer select-none hover:bg-slate-100/70 transition">
                    <input
                      type="checkbox"
                      checked={deductsBalance}
                      onChange={(e) => setDeductsBalance(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      data-testid="edit-deducts-balance-checkbox"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        Descontar estos días de la bolsa
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {deductsBalance
                          ? 'Los días aprobados restarán del saldo del empleado.'
                          : 'Los días aprobados NO afectarán el saldo (justificación / comisión).'}
                      </p>
                    </div>
                  </label>
                )}

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

// =============== BolsaTab (Bolsa de Días) ===============

const BolsaTab = ({ isAdmin, balances, myBalance, policies, employees, onRefresh }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [renewalFilter, setRenewalFilter] = useState('all'); // all | urgent | soon | upcoming | far

  // Enriquecer con days to renewal (siempre, independiente del rol para no romper hooks)
  const enriched = useMemo(() => {
    return (balances || []).map((b) => {
      const r = computeRenewal(b.hireDate);
      return {
        ...b,
        renewalDays: r ? r.days : null,
        renewalDate: r ? r.date : null,
        renewalLevel: r ? renewalLevel(r.days) : 'none',
      };
    });
  }, [balances]);

  // Aplicar filtros + orden por proximidad
  const filtered = useMemo(() => {
    let out = [...enriched];
    if (search) {
      const q = search.toLowerCase();
      out = out.filter(
        (b) =>
          (b.employeeName || '').toLowerCase().includes(q) ||
          (b.employeeDepartment || '').toLowerCase().includes(q) ||
          empCode(b.employeeId).toLowerCase().includes(q)
      );
    }
    if (renewalFilter !== 'all') {
      out = out.filter((b) => b.renewalLevel === renewalFilter);
    }
    out.sort((a, b) => {
      if (a.renewalDays == null && b.renewalDays == null) return 0;
      if (a.renewalDays == null) return 1;
      if (b.renewalDays == null) return -1;
      return a.renewalDays - b.renewalDays;
    });
    return out;
  }, [enriched, search, renewalFilter]);

  // Empleado view
  if (!isAdmin && myBalance) {
    const pct = myBalance.totalDays > 0 ? (myBalance.daysUsed / myBalance.totalDays) * 100 : 0;
    const sem = semaphoreBar(pct);
    const renew = computeRenewal(myBalance.hireDate);
    const level = renew ? renewalLevel(renew.days) : 'none';
    const rStyle = renewalStyle(level);

    return (
      <div className="space-y-5">
        {/* Alerta de renovación proactiva */}
        {renew && (level === 'urgent' || level === 'soon') && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-4 flex items-start gap-3 ${
              level === 'urgent'
                ? 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
            }`}
            data-testid="renewal-alert"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${rStyle.chip}`}>
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-bold ${level === 'urgent' ? 'text-red-800' : 'text-amber-800'}`}>
                {level === 'urgent'
                  ? '¡Tu bolsa se renueva muy pronto!'
                  : 'Tu bolsa se renovará próximamente'}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                En <span className="font-bold">{renew.days} día{renew.days === 1 ? '' : 's'}</span>
                {' '}({renew.date}) comenzará tu nuevo ciclo. Aprovecha los{' '}
                <span className="font-bold">{myBalance.daysAvailable} días disponibles</span> antes de la renovación.
              </p>
            </div>
          </motion.div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Mi Bolsa de Vacaciones</h3>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${sem.text} bg-white ring-1 ring-slate-200`}>
              {pct.toFixed(0)}% usado
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center mb-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{myBalance.totalDays}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-wider text-blue-600 font-semibold">Consumidos</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">{myBalance.daysUsed}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 ring-1 ring-emerald-200">
              <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">Disponibles</p>
              <p className="text-3xl font-bold text-emerald-700 mt-1">{myBalance.daysAvailable}</p>
            </div>
          </div>

          {/* Barra semáforo grande */}
          <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-200">
            <motion.div
              className={`h-full bg-gradient-to-r ${sem.bar} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pct, 100)}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
            {/* Marcas de semáforo */}
            <div className="absolute inset-0 flex justify-between items-center px-[1%] pointer-events-none">
              {[25, 50, 70, 90].map((m) => (
                <span key={m} className="w-px h-3 bg-white/60" style={{ position: 'absolute', left: `${m}%` }} />
              ))}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-wider font-semibold">
            <span className="text-emerald-600">● Bajo</span>
            <span className="text-yellow-600">● Moderado</span>
            <span className="text-orange-600">● Alto</span>
            <span className="text-red-600">● Crítico</span>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Has consumido {myBalance.daysUsed} de {myBalance.totalDays} días ({pct.toFixed(0)}%)
          </p>

          {/* Renovación */}
          {renew && (
            <div className="mt-5 pt-5 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rStyle.chip}`}>
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Próxima renovación</p>
                  <p className="text-sm font-bold text-slate-900">
                    {renew.date} · <span className={rStyle.icon}>{renew.days} días</span>
                  </p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${rStyle.chip}`}>
                {rStyle.label}
              </span>
            </div>
          )}

          {myBalance.seniorityYears != null && (
            <div className="mt-5 pt-5 border-t border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Antigüedad</p>
                <p className="text-lg font-bold text-slate-900">
                  {Math.floor(myBalance.seniorityYears)} años
                </p>
                {myBalance.hireDate && (
                  <p className="text-xs text-slate-500 mt-0.5">Desde {myBalance.hireDate}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Política aplicada</p>
                <p className="text-sm font-medium text-slate-700 mt-1">
                  {policies.find(
                    (p) =>
                      p.yearsFrom <= myBalance.seniorityYears &&
                      myBalance.seniorityYears < p.yearsTo
                  )?.name || '—'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin view (enriched/filtered calculados arriba)

  const urgentCount = enriched.filter((b) => b.renewalLevel === 'urgent').length;
  const soonCount = enriched.filter((b) => b.renewalLevel === 'soon').length;

  const RENEWAL_FILTERS = [
    { key: 'all', label: 'Todos', count: enriched.length, cls: 'bg-slate-900 text-white' },
    { key: 'urgent', label: 'Urgentes', count: urgentCount, cls: 'bg-red-100 text-red-700' },
    { key: 'soon', label: 'Próximos', count: soonCount, cls: 'bg-amber-100 text-amber-700' },
    { key: 'upcoming', label: 'Cercanos', count: enriched.filter((b) => b.renewalLevel === 'upcoming').length, cls: 'bg-blue-100 text-blue-700' },
    { key: 'far', label: 'Lejanos', count: enriched.filter((b) => b.renewalLevel === 'far').length, cls: 'bg-slate-100 text-slate-600' },
  ];

  return (
    <div className="space-y-5">
      {/* Notificación proactiva admin */}
      {(urgentCount + soonCount) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl border border-amber-200 p-4 flex items-start gap-3"
          data-testid="admin-renewal-alert"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">
              {urgentCount > 0 && (
                <>
                  <span className="text-red-700">{urgentCount}</span> empleado{urgentCount === 1 ? '' : 's'} con renovación urgente
                </>
              )}
              {urgentCount > 0 && soonCount > 0 && ' · '}
              {soonCount > 0 && (
                <>
                  <span className="text-amber-700">{soonCount}</span> con renovación próxima
                </>
              )}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Recuerda recordar a estos empleados que disfruten de sus días disponibles antes del cierre de su ciclo.
            </p>
          </div>
        </motion.div>
      )}

      {/* Filters & actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <Filter className="w-4 h-4" />
            Filtros de renovación:
          </div>
          <div className="flex flex-wrap gap-2 flex-1">
            {RENEWAL_FILTERS.map((f) => {
              const active = renewalFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setRenewalFilter(f.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    active ? f.cls + ' shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  data-testid={`renewal-filter-${f.key}`}
                >
                  {f.label}
                  <span className={`inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-bold ${
                    active ? 'bg-white/25' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar empleado, depto, código…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full lg:w-72 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              data-testid="bolsa-search"
            />
          </div>
          <button
            onClick={() => setShowWarning(true)}
            className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800 shadow-sm"
            data-testid="nueva-bolsa-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva bolsa
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            Bolsa de Días — ordenada por proximidad de renovación
          </h3>
          <span className="text-xs text-slate-500">Año {new Date().getFullYear()} · {filtered.length} / {enriched.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-medium">Empleado</th>
                <th className="px-5 py-3 font-medium">Renueva en</th>
                <th className="px-5 py-3 font-medium">Antigüedad</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Usados</th>
                <th className="px-5 py-3 font-medium">Pendientes</th>
                <th className="px-5 py-3 font-medium">Disponibles</th>
                <th className="px-5 py-3 font-medium">
                  <div className="inline-flex items-center gap-1.5 group/uso relative cursor-help">
                    <span>Uso</span>
                    <AlertCircle className="w-3 h-3 text-slate-400" />
                    <span className="invisible group-hover/uso:visible opacity-0 group-hover/uso:opacity-100 transition-opacity absolute left-0 top-full mt-1 z-20 w-64 bg-slate-900 text-white text-[11px] font-normal normal-case tracking-normal rounded-lg p-2.5 shadow-lg pointer-events-none">
                      <span className="block font-semibold mb-1">Semáforo de uso</span>
                      <span className="block">El semáforo indica el nivel de uso de la bolsa de días según los días utilizados.</span>
                      <span className="block mt-1 text-slate-300">🟢 Verde: bajo · 🟡 Amarillo: medio · 🔴 Rojo: alto/crítico</span>
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">
                    Sin resultados con estos filtros
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const pct = b.totalDays > 0 ? (b.daysUsed / b.totalDays) * 100 : 0;
                  const sem = semaphoreBar(pct);
                  const rStyle = renewalStyle(b.renewalLevel);
                  return (
                    <tr key={b.employeeId} className="hover:bg-slate-50/60" data-testid={`balance-row-${b.employeeId}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img src={b.employeeAvatar} alt={b.employeeName} className="w-9 h-9 rounded-full bg-slate-100 object-cover ring-1 ring-slate-200" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{b.employeeName}</p>
                            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">{empCode(b.employeeId)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {b.renewalDays != null ? (
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${rStyle.chip} w-fit`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${rStyle.dot}`} />
                              {b.renewalDays} día{b.renewalDays === 1 ? '' : 's'}
                            </span>
                            <span className="text-[10px] text-slate-400">{b.renewalDate}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {b.seniorityYears != null ? `${Math.floor(b.seniorityYears)} años` : '—'}
                          </p>
                          {b.hireDate && <p className="text-[11px] text-slate-500">{b.hireDate}</p>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-slate-900">{b.totalDays}</td>
                      <td className="px-5 py-3 text-sm text-blue-700 font-medium">{b.daysUsed}</td>
                      <td className="px-5 py-3 text-sm text-amber-700 font-medium">{b.daysPending}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                          {b.daysAvailable}
                        </span>
                      </td>
                      <td className="px-5 py-3 w-52">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full bg-gradient-to-r ${sem.bar}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(pct, 100)}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                            />
                          </div>
                          <span className={`text-[11px] font-bold tabular-nums ${sem.text} min-w-[38px] text-right`}>
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showWarning && (
        <NewBalanceWarningModal
          onCancel={() => setShowWarning(false)}
          onContinue={() => {
            setShowWarning(false);
            setShowForm(true);
          }}
        />
      )}
      {showForm && (
        <NewBalanceFormModal
          employees={employees}
          balances={balances}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

// =============== NewBalanceWarningModal ===============

const NewBalanceWarningModal = ({ onCancel, onContinue }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={onCancel}
    data-testid="new-balance-warning"
  >
    <motion.div
      initial={{ scale: 0.96 }}
      animate={{ scale: 1 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
    >
      <div className="px-6 pt-6 pb-2 flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Atención: crear bolsa manual</h3>
          <p className="text-sm text-slate-500 mt-0.5">Esta funcionalidad está pensada para casos especiales.</p>
        </div>
      </div>
      <div className="px-6 py-4 space-y-3">
        <p className="text-sm text-slate-700">
          El sistema gestiona automáticamente las bolsas de vacaciones por empleado según su antigüedad y las
          políticas definidas. Solo deberías crear una bolsa manualmente en situaciones como:
        </p>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
            <span>
              <span className="font-semibold">Regularización manual:</span> empleados provenientes de contratos
              anteriores o fusiones de empresas cuya antigüedad se respeta pero su saldo de vacaciones difiere del resto.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
            <span>
              <span className="font-semibold">Cierre y apertura anual:</span> en algunos países, al cerrar el año
              natural (31 dic), la bolsa anterior caduca y se genera una nueva para el siguiente ejercicio.
            </span>
          </li>
        </ul>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Confirma que realmente necesitas crear una bolsa manualmente antes de continuar.</span>
        </div>
      </div>
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
          data-testid="new-balance-warning-cancel"
        >
          Cancelar
        </button>
        <button
          onClick={onContinue}
          className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700"
          data-testid="new-balance-warning-continue"
        >
          Entiendo, continuar
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// =============== NewBalanceFormModal ===============

const NewBalanceFormModal = ({ employees, balances, onClose, onSaved }) => {
  const [form, setForm] = useState({
    employeeId: '',
    year: new Date().getFullYear(),
    totalDays: 12,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!form.employeeId) {
      setError('Selecciona un empleado');
      return;
    }
    if (!form.totalDays || form.totalDays < 0) {
      setError('Los días deben ser mayores o iguales a 0');
      return;
    }
    setSaving(true);
    try {
      await vacationsAPI.adjustBalance(form.employeeId, {
        year: Number(form.year),
        totalDays: Number(form.totalDays),
      });
      onSaved();
    } catch (e) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="new-balance-form"
    >
      <motion.div
        initial={{ scale: 0.96 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Nueva bolsa manual</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Empleado</label>
            <select
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              data-testid="new-balance-employee"
            >
              <option value="">— Selecciona —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {e.department}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Año</label>
              <input
                type="number"
                min={2000}
                max={2100}
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Días totales</label>
              <input
                type="number"
                min={0}
                value={form.totalDays}
                onChange={(e) => setForm({ ...form, totalDays: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1.5"
            data-testid="new-balance-save"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// =============== PoliciesTab (Políticas + Festivos) ===============

const PoliciesTab = ({ policies, holidays, onRefresh }) => {
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [creatingPolicy, setCreatingPolicy] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [creatingHoliday, setCreatingHoliday] = useState(false);

  const handleDeletePolicy = async (id) => {
    if (!window.confirm('¿Eliminar esta política?')) return;
    await vacationPoliciesAPI.delete(id);
    onRefresh();
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm('¿Eliminar este festivo?')) return;
    await vacationHolidaysAPI.delete(id);
    onRefresh();
  };

  // Orden por yearsFrom ascendente
  const sortedPolicies = useMemo(
    () => [...(policies || [])].sort((a, b) => (a.yearsFrom || 0) - (b.yearsFrom || 0)),
    [policies]
  );

  return (
    <div className="space-y-6">
      {/* Policies header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-500" />
            Políticas por antigüedad
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Los colores representan la madurez: fresco → experimentado → senior
          </p>
        </div>
        <button
          onClick={() => setCreatingPolicy(true)}
          className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800 shadow-sm"
          data-testid="new-policy-btn"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva política
        </button>
      </div>

      {/* Policies cards grid */}
      {sortedPolicies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Shield className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">No hay políticas definidas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {sortedPolicies.map((p, i) => {
            const palette = maturityPalette(p.yearsFrom);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className={`relative bg-gradient-to-br ${palette.from} ${palette.to} rounded-2xl border ${palette.ring} ring-1 p-5 shadow-sm hover:shadow-md transition-shadow group`}
                data-testid={`policy-card-${p.id}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-11 h-11 rounded-xl ${palette.icon} flex items-center justify-center shadow-sm`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingPolicy(p)}
                      className="p-1.5 rounded-lg bg-white/60 backdrop-blur text-slate-500 hover:text-slate-900"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePolicy(p.id)}
                      className="p-1.5 rounded-lg bg-white/60 backdrop-blur text-slate-500 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h4 className={`text-xl font-black ${palette.accent} leading-tight`}>
                  {p.yearsFrom} a {p.yearsTo >= 999 ? '∞' : p.yearsTo} años
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 uppercase tracking-wider font-medium">
                  {p.name || palette.label}
                </p>

                {/* Divider */}
                <div className="my-4 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

                {/* Description */}
                {p.description && (
                  <p className="text-xs text-slate-600 mb-4 italic line-clamp-2">
                    {p.description}
                  </p>
                )}

                {/* Días badge */}
                <div className="flex items-end justify-between mt-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Días de ley</p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className={`text-4xl font-black ${palette.accent}`}>{p.days}</span>
                      <span className="text-sm text-slate-500 font-medium">días</span>
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full ${palette.icon} flex items-center justify-center`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>

                {/* Maturity bar */}
                <div className="mt-4 h-1.5 bg-white/50 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${palette.barFrom} ${palette.barTo}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(((p.yearsFrom + 1) / 12) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            );
          })}

          {/* Add new card */}
          <button
            onClick={() => setCreatingPolicy(true)}
            className="rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-900 hover:bg-slate-50 transition-all p-5 flex flex-col items-center justify-center gap-2 min-h-[220px] text-slate-400 hover:text-slate-900"
            data-testid="new-policy-card"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold">Nueva política</span>
          </button>
        </div>
      )}

      {/* Holidays card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <PartyPopper className="w-4 h-4 text-orange-500" />
              Días festivos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Fechas marcadas como festivos — no computan en las solicitudes
            </p>
          </div>
          <button
            onClick={() => setCreatingHoliday(true)}
            className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo festivo
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">País</th>
                <th className="px-5 py-3 font-medium">Recurrente</th>
                <th className="px-5 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">
                    No hay festivos definidos
                  </td>
                </tr>
              ) : (
                holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 text-sm font-medium text-slate-900">{h.date}</td>
                    <td className="px-5 py-3 text-sm text-slate-700">{h.name}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{h.country}</td>
                    <td className="px-5 py-3">
                      {h.recurring ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold">
                          Anual
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Solo {h.date.slice(0, 4)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingHoliday(h)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(editingPolicy || creatingPolicy) && (
        <PolicyEditModal
          policy={editingPolicy}
          onClose={() => {
            setEditingPolicy(null);
            setCreatingPolicy(false);
          }}
          onSave={async (data) => {
            if (editingPolicy) {
              await vacationPoliciesAPI.update(editingPolicy.id, data);
            } else {
              await vacationPoliciesAPI.create(data);
            }
            onRefresh();
          }}
        />
      )}

      {(editingHoliday || creatingHoliday) && (
        <HolidayEditModal
          holiday={editingHoliday}
          onClose={() => {
            setEditingHoliday(null);
            setCreatingHoliday(false);
          }}
          onSave={async (data) => {
            if (editingHoliday) {
              await vacationHolidaysAPI.update(editingHoliday.id, data);
            } else {
              await vacationHolidaysAPI.create(data);
            }
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

// =============== PolicyEditModal ===============

const PolicyEditModal = ({ policy, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: policy?.name || '',
    yearsFrom: policy?.yearsFrom ?? 0,
    yearsTo: policy?.yearsTo ?? 1,
    days: policy?.days ?? 12,
    description: policy?.description || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (form.yearsTo <= form.yearsFrom) {
      setError('Años hasta debe ser mayor que Años desde');
      return;
    }
    if (form.days <= 0) {
      setError('Los días deben ser mayores a 0');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: form.name || `${form.yearsFrom} - ${form.yearsTo} años`,
        yearsFrom: Number(form.yearsFrom),
        yearsTo: Number(form.yearsTo),
        days: Number(form.days),
        description: form.description,
      });
      onClose();
    } catch (e) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {policy ? 'Editar política' : 'Nueva política'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nombre</label>
            <input
              type="text"
              placeholder="Ej: 0 - 1 año"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Años desde</label>
              <input
                type="number"
                min={0}
                value={form.yearsFrom}
                onChange={(e) => setForm({ ...form, yearsFrom: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Años hasta</label>
              <input
                type="number"
                min={1}
                value={form.yearsTo}
                onChange={(e) => setForm({ ...form, yearsTo: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Días otorgados
            </label>
            <input
              type="number"
              min={1}
              value={form.days}
              onChange={(e) => setForm({ ...form, days: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Descripción</label>
            <textarea
              rows={2}
              placeholder="Opcional"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// =============== HolidayEditModal ===============

const HolidayEditModal = ({ holiday, onClose, onSave }) => {
  const [form, setForm] = useState({
    date: holiday?.date || '',
    name: holiday?.name || '',
    country: holiday?.country || 'ES',
    recurring: holiday?.recurring ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!form.date || !form.name) {
      setError('Fecha y nombre son obligatorios');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {holiday ? 'Editar festivo' : 'Nuevo festivo'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Fecha</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nombre</label>
            <input
              type="text"
              placeholder="Ej: Navidad"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">País</label>
            <input
              type="text"
              maxLength={3}
              placeholder="ES"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.recurring}
              onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="text-sm text-slate-700">
              Se repite cada año (mismo día y mes)
            </span>
          </label>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// =============== SugeridasTab (Rangos sugeridos) ===============

const rangeColorPalette = {
  slate: { from: 'from-slate-100', to: 'to-white', ring: 'ring-slate-200', icon: 'bg-slate-100 text-slate-700', accent: 'text-slate-900' },
  emerald: { from: 'from-emerald-100', to: 'to-white', ring: 'ring-emerald-200', icon: 'bg-emerald-100 text-emerald-700', accent: 'text-emerald-800' },
  blue: { from: 'from-blue-100', to: 'to-white', ring: 'ring-blue-200', icon: 'bg-blue-100 text-blue-700', accent: 'text-blue-800' },
  amber: { from: 'from-amber-100', to: 'to-white', ring: 'ring-amber-200', icon: 'bg-amber-100 text-amber-700', accent: 'text-amber-800' },
  rose: { from: 'from-rose-100', to: 'to-white', ring: 'ring-rose-200', icon: 'bg-rose-100 text-rose-700', accent: 'text-rose-800' },
  violet: { from: 'from-violet-100', to: 'to-white', ring: 'ring-violet-200', icon: 'bg-violet-100 text-violet-700', accent: 'text-violet-800' },
};

const SugeridasTab = ({ ranges, holidays, isAdmin, onRefresh }) => {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este rango sugerido?')) return;
    await vacationSuggestedAPI.delete(id);
    onRefresh();
  };

  const businessDaysCount = (startIso, endIso) => {
    const arr = buildSelectedDaysFromRange(startIso, endIso, false);
    return arr.length;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-slate-500" />
            Vacaciones sugeridas
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Rangos preconfigurados que los empleados pueden aplicar al crear una solicitud
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800 shadow-sm"
            data-testid="new-suggested-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo rango
          </button>
        )}
      </div>

      {ranges.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <CalendarRange className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">No hay rangos sugeridos aún</p>
          {isAdmin && (
            <button
              onClick={() => setCreating(true)}
              className="mt-3 inline-flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear el primero
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ranges.map((r, i) => {
            const palette = rangeColorPalette[r.color] || rangeColorPalette.slate;
            const dias = businessDaysCount(r.startDate, r.endDate);
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className={`group relative bg-gradient-to-br ${palette.from} ${palette.to} rounded-2xl border ${palette.ring} ring-1 p-5 shadow-sm hover:shadow-md transition-shadow`}
                data-testid={`suggested-card-${r.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl ${palette.icon} flex items-center justify-center shadow-sm`}>
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditing(r)}
                        className="p-1.5 rounded-lg bg-white/70 backdrop-blur text-slate-500 hover:text-slate-900"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 rounded-lg bg-white/70 backdrop-blur text-slate-500 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <h4 className={`text-lg font-black ${palette.accent}`}>{r.name}</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {r.startDate} <span className="text-slate-400">→</span> {r.endDate}
                </p>
                {r.description && (
                  <p className="text-xs text-slate-600 mt-3 italic line-clamp-2">{r.description}</p>
                )}
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                    Días laborables
                  </span>
                  <span className={`text-base font-black ${palette.accent}`}>{dias}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {(editing || creating) && (
        <SuggestedEditModal
          range={editing}
          holidays={holidays}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={async (data) => {
            if (editing) {
              await vacationSuggestedAPI.update(editing.id, data);
            } else {
              await vacationSuggestedAPI.create(data);
            }
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

// =============== SuggestedEditModal (con calendario) ===============

const SuggestedEditModal = ({ range, holidays, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: range?.name || '',
    description: range?.description || '',
    color: range?.color || 'slate',
  });
  const initialDays = range
    ? buildSelectedDaysFromRange(range.startDate, range.endDate, true)
    : [];
  const [days, setDays] = useState(initialDays);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const sortedDays = useMemo(() => [...days].sort(), [days]);
  const startDate = sortedDays[0] || null;
  const endDate = sortedDays[sortedDays.length - 1] || null;
  const totalBusiness = sortedDays.filter((iso) => {
    const d = new Date(iso + 'T00:00:00');
    const dow = d.getDay();
    return dow !== 0 && dow !== 6;
  }).length;

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) {
      setError('Pon un nombre al rango');
      return;
    }
    if (!startDate || !endDate) {
      setError('Selecciona al menos un día');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        startDate,
        endDate,
        description: form.description,
        color: form.color,
      });
      onClose();
    } catch (e) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const colorChoices = ['slate', 'emerald', 'blue', 'amber', 'rose', 'violet'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="suggested-form"
    >
      <motion.div
        initial={{ scale: 0.96 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <CalendarRange className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {range ? 'Editar rango sugerido' : 'Nuevo rango sugerido'}
              </h3>
              <p className="text-xs text-slate-500">Elige los días en el calendario</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nombre</label>
              <input
                type="text"
                placeholder="Ej: Puente de Mayo, Verano, Navidad…"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                data-testid="suggested-name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Descripción</label>
              <textarea
                rows={3}
                placeholder="Opcional: contexto del rango sugerido…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Color</label>
              <div className="flex flex-wrap gap-2">
                {colorChoices.map((c) => {
                  const p = rangeColorPalette[c];
                  const active = form.color === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-9 h-9 rounded-xl ${p.icon} flex items-center justify-center transition-all ${
                        active ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105'
                      }`}
                      title={c}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 ring-1 ring-slate-200/60">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-3">
                Resumen
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-500">Inicio</p>
                  <p className="font-bold text-slate-900">{startDate || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Fin</p>
                  <p className="font-bold text-slate-900">{endDate || '—'}</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-slate-500">Días laborables</span>
                  <span className="font-black text-slate-900 text-base">{totalBusiness}</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Selecciona los días del rango
            </label>
            <Calendar360
              value={sortedDays}
              onChange={setDays}
              countWeekends={true}
              holidays={holidays}
            />
            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1.5"
            data-testid="suggested-save"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
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
  const [holidays, setHolidays] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [suggestedRanges, setSuggestedRanges] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('solicitudes'); // solicitudes | bolsa | sugeridas | politicas
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reviewing, setReviewing] = useState(null);
  const [documentRequest, setDocumentRequest] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reqs, emps, hols, pols, ranges] = await Promise.all([
        vacationsAPI.list({ status: filterStatus, search }),
        isAdmin ? employeesAPI.getAll() : Promise.resolve([]),
        vacationHolidaysAPI.list().catch(() => []),
        vacationPoliciesAPI.list().catch(() => []),
        vacationSuggestedAPI.list().catch(() => []),
      ]);
      setRequests(reqs);
      setEmployees(emps);
      setHolidays(hols);
      setPolicies(pols);
      setSuggestedRanges(ranges);

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

      {/* Sub-navigation tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm inline-flex flex-wrap">
        {[
          { key: 'solicitudes', label: 'Solicitudes', icon: ListChecks },
          { key: 'bolsa', label: 'Bolsa de días', icon: WalletIcon },
          { key: 'sugeridas', label: 'Sugeridas', icon: CalendarRange },
          { key: 'politicas', label: 'Políticas', icon: Settings, adminOnly: true },
        ].map((t) => {
          if (t.adminOnly && !isAdmin) return null;
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              data-testid={`tab-${t.key}`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'solicitudes' && (
          <motion.div
            key="solicitudes"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >

      {/* KPI cards removed per request */}

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
                <th className="px-5 py-3 font-medium">Periodos</th>
                <th className="px-5 py-3 font-medium">Días Totales</th>
                <th className="px-5 py-3 font-medium">Fines de Sem.</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                    Cargando solicitudes…
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
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
                      data-testid={`request-row-${r.id}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={r.employeeAvatar}
                            alt={r.employeeName}
                            className="w-10 h-10 rounded-full bg-slate-100 ring-1 ring-slate-200 object-cover"
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{r.employeeName}</p>
                            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                              {empCode(r.employeeId)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 text-sm text-slate-700">
                          <CalendarDays className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">
                            {r.startDate} <span className="text-slate-400">al</span> {r.endDate}
                          </span>
                        </div>
                        <div className="mt-1">
                          <TypeChip type={r.type} />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-base font-bold text-slate-900">{r.totalDays}</span>
                        <span className="ml-1 text-xs text-slate-500">días</span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            r.countWeekends
                              ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                              : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                          }`}
                        >
                          {r.countWeekends ? 'Incluidos' : 'Excluidos'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDocumentRequest(r)}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="Ver formato de vacaciones"
                            data-testid={`action-doc-${r.id}`}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {isAdmin && r.status === 'Pendiente' && (
                            <>
                              <button
                                onClick={() => handleAction(r.id, { status: 'Aprobado', adminComment: '' })}
                                className="p-2 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                                title="Aprobar"
                                data-testid={`action-approve-${r.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleAction(r.id, { status: 'Rechazado', adminComment: '' })}
                                className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                                title="Rechazar"
                                data-testid={`action-reject-${r.id}`}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => setReviewing(r)}
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
                              title="Editar"
                              data-testid={`action-edit-${r.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {(isAdmin || (!isAdmin && r.status === 'Pendiente')) && (
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Eliminar"
                              data-testid={`action-delete-${r.id}`}
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

      {/* Admin: balance summary - MOVED to "bolsa" tab */}
          </motion.div>
        )}

        {activeTab === 'bolsa' && (
          <motion.div
            key="bolsa"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <BolsaTab
              isAdmin={isAdmin}
              balances={balances}
              myBalance={myBalance}
              policies={policies}
              employees={employees}
              onRefresh={fetchAll}
            />
          </motion.div>
        )}

        {activeTab === 'sugeridas' && (
          <motion.div
            key="sugeridas"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <SugeridasTab
              ranges={suggestedRanges}
              holidays={holidays}
              isAdmin={isAdmin}
              onRefresh={fetchAll}
            />
          </motion.div>
        )}

        {activeTab === 'politicas' && isAdmin && (
          <motion.div
            key="politicas"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <PoliciesTab
              policies={policies}
              holidays={holidays}
              onRefresh={fetchAll}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin: balance summary OLD (rendered only inside "bolsa" tab now) */}
      {false && isAdmin && balances.length > 0 && (
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

      <RequestModal
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleCreate}
        employees={employees}
        isAdmin={isAdmin}
        currentEmployeeId={user?.employee_id}
        balance={myBalance}
        balances={balances}
        holidays={holidays}
        suggestedRanges={suggestedRanges}
      />

      {reviewing && (
        <EditRequestModal
          request={reviewing}
          balance={reviewingBalance}
          holidays={holidays}
          onClose={() => setReviewing(null)}
          onSave={handleSaveEdit}
        />
      )}

      {documentRequest && (
        <VacationDocument
          request={documentRequest}
          employee={employees.find((e) => e.id === documentRequest.employeeId)}
          currentUser={user}
          onClose={() => setDocumentRequest(null)}
          onUpdate={(updated) => {
            setDocumentRequest(updated);
            fetchAll();
          }}
        />
      )}
    </div>
  );
};

export default VacationsView;
