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
  AlertCircle,
  TrendingDown,
  Wallet,
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

// =============== Drawer: Review (Admin) ===============

const ReviewDrawer = ({ request, onClose, onAction }) => {
  const [comment, setComment] = useState('');
  const [loadingAction, setLoadingAction] = useState('');

  useEffect(() => {
    setComment(request?.adminComment || '');
  }, [request?.id]);

  if (!request) return null;

  const act = async (status) => {
    setLoadingAction(status);
    try {
      await onAction(request.id, { status, adminComment: comment });
      onClose();
    } finally {
      setLoadingAction('');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white shadow-2xl z-50 flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Revisar solicitud</h3>
            <p className="text-xs text-slate-500">Aprueba, rechaza o justifica</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex items-center gap-3">
            <img
              src={request.employeeAvatar}
              alt={request.employeeName}
              className="w-12 h-12 rounded-full bg-slate-100"
            />
            <div>
              <p className="font-semibold text-slate-900">{request.employeeName}</p>
              <p className="text-xs text-slate-500">{request.employeeDepartment}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Tipo</p>
              <TypeChip type={request.type} />
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Días</p>
              <p className="text-lg font-bold text-slate-900">{request.totalDays}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Desde</p>
              <p className="text-sm font-medium text-slate-900">{formatDate(request.startDate)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Hasta</p>
              <p className="text-sm font-medium text-slate-900">{formatDate(request.endDate)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 col-span-2">
              <p className="text-xs text-slate-500 mb-1">Regreso estimado</p>
              <p className="text-sm font-medium text-slate-900">{formatDate(request.returnDate)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1.5">Motivo del empleado</p>
            <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700 min-h-[60px]">
              {request.reason || <span className="text-slate-400">Sin motivo</span>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Comentario administrativo</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Añade una nota (opcional)…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
          </div>

          <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="font-medium text-amber-700 mb-0.5">Impacto en saldo</p>
            <p>
              <strong>Aprobado</strong>: resta {request.totalDays} días del saldo (si aplica al tipo).
              <br />
              <strong>Justificado</strong>: no resta del saldo (ej. médico con comprobante).
              <br />
              <strong>Rechazado</strong>: no afecta el saldo.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 p-4 grid grid-cols-3 gap-2">
          <button
            onClick={() => act('Rechazado')}
            disabled={!!loadingAction}
            className="px-3 py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 text-sm font-semibold flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            Rechazar
          </button>
          <button
            onClick={() => act('Justificado')}
            disabled={!!loadingAction}
            className="px-3 py-2.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 text-sm font-semibold flex items-center justify-center gap-1.5"
          >
            <FileCheck2 className="w-4 h-4" />
            Justificar
          </button>
          <button
            onClick={() => act('Aprobado')}
            disabled={!!loadingAction}
            className="px-3 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Aprobar
          </button>
        </div>
      </motion.aside>
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
        <ReviewDrawer
          request={reviewing}
          onClose={() => setReviewing(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
};

export default VacationsView;
