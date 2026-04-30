const API_URL = process.env.REACT_APP_BACKEND_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Employees API
export const employeesAPI = {
  getAll: async (department = null) => {
    const url = department && department !== 'all' 
      ? `${API_URL}/api/employees?department=${department}`
      : `${API_URL}/api/employees`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch employees');
    return response.json();
  },

  getOne: async (id) => {
    const response = await fetch(`${API_URL}/api/employees/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch employee');
    return response.json();
  },

  create: async (data) => {
    const response = await fetch(`${API_URL}/api/employees`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create employee');
    return response.json();
  },

  update: async (id, data) => {
    const response = await fetch(`${API_URL}/api/employees/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update employee');
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/api/employees/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete employee');
    return response.json();
  }
};

// Aciertos y Desaciertos API
export const aciertosAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.month && filters.month !== 'all') params.append('month', filters.month);
    if (filters.year && filters.year !== 'all') params.append('year', filters.year);
    if (filters.department && filters.department !== 'all') params.append('department', filters.department);
    if (filters.employee_id && filters.employee_id !== 'all') params.append('employee_id', filters.employee_id);
    
    const url = `${API_URL}/api/aciertos-desaciertos${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch evaluations');
    return response.json();
  },

  getOne: async (id) => {
    const response = await fetch(`${API_URL}/api/aciertos-desaciertos/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch evaluation');
    return response.json();
  },

  create: async (data) => {
    const response = await fetch(`${API_URL}/api/aciertos-desaciertos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create evaluation');
    return response.json();
  },

  update: async (id, data) => {
    const response = await fetch(`${API_URL}/api/aciertos-desaciertos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update evaluation');
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/api/aciertos-desaciertos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete evaluation');
    return response.json();
  }
};

// KPIs API
export const kpisAPI = {
  // Templates
  getTemplates: async () => {
    const response = await fetch(`${API_URL}/api/kpis/templates`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch KPI templates');
    return response.json();
  },

  getTemplate: async (id) => {
    const response = await fetch(`${API_URL}/api/kpis/templates/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch KPI template');
    return response.json();
  },

  createTemplate: async (data) => {
    const response = await fetch(`${API_URL}/api/kpis/templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create KPI template');
    return response.json();
  },

  updateTemplate: async (id, data) => {
    const response = await fetch(`${API_URL}/api/kpis/templates/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update KPI template');
    return response.json();
  },

  deleteTemplate: async (id) => {
    const response = await fetch(`${API_URL}/api/kpis/templates/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete KPI template');
    return response.json();
  },

  // Assignments
  getAssignments: async () => {
    const response = await fetch(`${API_URL}/api/kpis/assignments`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch KPI assignments');
    return response.json();
  },

  createAssignment: async (data) => {
    const response = await fetch(`${API_URL}/api/kpis/assignments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create KPI assignment');
    return response.json();
  },

  deleteAssignment: async (id) => {
    const response = await fetch(`${API_URL}/api/kpis/assignments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete KPI assignment');
    return response.json();
  },

  // Evaluations
  getEvaluations: async () => {
    const response = await fetch(`${API_URL}/api/kpis/evaluations`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch KPI evaluations');
    return response.json();
  },

  createEvaluation: async (data) => {
    const response = await fetch(`${API_URL}/api/kpis/evaluations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create KPI evaluation');
    return response.json();
  }
};

// Evaluations 360 API
export const eval360API = {
  // Templates
  getTemplates: async () => {
    const response = await fetch(`${API_URL}/api/evaluations360/templates`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch Eval360 templates');
    return response.json();
  },

  getTemplate: async (id) => {
    const response = await fetch(`${API_URL}/api/evaluations360/templates/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch Eval360 template');
    return response.json();
  },

  createTemplate: async (data) => {
    const response = await fetch(`${API_URL}/api/evaluations360/templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create Eval360 template');
    return response.json();
  },

  updateTemplate: async (id, data) => {
    const response = await fetch(`${API_URL}/api/evaluations360/templates/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update Eval360 template');
    return response.json();
  },

  deleteTemplate: async (id) => {
    const response = await fetch(`${API_URL}/api/evaluations360/templates/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete Eval360 template');
    return response.json();
  },

  // Plans
  getPlans: async () => {
    const response = await fetch(`${API_URL}/api/evaluations360/plans`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch evaluation plans');
    return response.json();
  },

  createPlan: async (data) => {
    const response = await fetch(`${API_URL}/api/evaluations360/plans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create evaluation plan');
    return response.json();
  },

  getPlan: async (id) => {
    const response = await fetch(`${API_URL}/api/evaluations360/plans/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch evaluation plan');
    return response.json();
  },

  deletePlan: async (id) => {
    const response = await fetch(`${API_URL}/api/evaluations360/plans/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete evaluation plan');
    return response.json();
  },

  updatePlan: async (id, data) => {
    const response = await fetch(`${API_URL}/api/evaluations360/plans/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update evaluation plan');
    return response.json();
  },

  // Results
  getResults: async () => {
    const response = await fetch(`${API_URL}/api/evaluations360/results`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch evaluation results');
    return response.json();
  },

  submitEvaluation: async (data) => {
    const response = await fetch(`${API_URL}/api/evaluations360/submit-evaluation`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to submit evaluation');
    }
    return response.json();
  },


  // PDIs
  getPDIs: async () => {
    const response = await fetch(`${API_URL}/api/evaluations360/pdis`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch PDIs');
    return response.json();
  },

  createPDI: async (data) => {
    const response = await fetch(`${API_URL}/api/evaluations360/pdis`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create PDI');
    return response.json();
  },

  updatePDI: async (id, data) => {
    const response = await fetch(`${API_URL}/api/evaluations360/pdis/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update PDI');
    return response.json();
  }
};

// PDI API (simplified)
export const pdiAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/api/evaluations360/pdis`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch PDIs');
    return response.json();
  },

  getMyPDI: async () => {
    const response = await fetch(`${API_URL}/api/evaluations360/pdis`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch my PDI');
    const pdis = await response.json();
    return pdis.length > 0 ? pdis : [];
  },

  create: async (data) => {
    const response = await fetch(`${API_URL}/api/pdi/create-simple`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create PDI');
    }
    return response.json();
  }
};


// Vacations API
export const vacationsAPI = {
  list: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.employee_id && filters.employee_id !== 'all') params.append('employee_id', filters.employee_id);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    const url = `${API_URL}/api/vacations${params.toString() ? '?' + params.toString() : ''}`;
    const r = await fetch(url, { headers: getAuthHeaders() });
    if (!r.ok) throw new Error('Failed to fetch vacation requests');
    return r.json();
  },
  create: async (data) => {
    const r = await fetch(`${API_URL}/api/vacations`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create vacation request');
    }
    return r.json();
  },
  update: async (id, data) => {
    const r = await fetch(`${API_URL}/api/vacations/${id}`, {
      method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(data),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update request');
    }
    return r.json();
  },
  updateStatus: async (id, data) => {
    const r = await fetch(`${API_URL}/api/vacations/${id}/status`, {
      method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(data),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update status');
    }
    return r.json();
  },
  delete: async (id) => {
    const r = await fetch(`${API_URL}/api/vacations/${id}`, {
      method: 'DELETE', headers: getAuthHeaders(),
    });
    if (!r.ok) throw new Error('Failed to delete request');
    return r.json();
  },
  myBalance: async (year) => {
    const url = `${API_URL}/api/vacations/balance/me${year ? '?year=' + year : ''}`;
    const r = await fetch(url, { headers: getAuthHeaders() });
    if (!r.ok) throw new Error('Failed to fetch my balance');
    return r.json();
  },
  balances: async (year) => {
    const url = `${API_URL}/api/vacations/balances${year ? '?year=' + year : ''}`;
    const r = await fetch(url, { headers: getAuthHeaders() });
    if (!r.ok) throw new Error('Failed to fetch balances');
    return r.json();
  },
  employeeBalance: async (employeeId, year) => {
    const url = `${API_URL}/api/vacations/balance/${employeeId}${year ? '?year=' + year : ''}`;
    const r = await fetch(url, { headers: getAuthHeaders() });
    if (!r.ok) throw new Error('Failed to fetch employee balance');
    return r.json();
  },
  adjustBalance: async (employeeId, payload) => {
    const r = await fetch(`${API_URL}/api/vacations/balance/${employeeId}/adjust`, {
      method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to adjust balance');
    }
    return r.json();
  },
};

// Vacation Policies API
export const vacationPoliciesAPI = {
  list: async () => {
    const r = await fetch(`${API_URL}/api/vacation-policies`, { headers: getAuthHeaders() });
    if (!r.ok) throw new Error('Failed to fetch policies');
    return r.json();
  },
  create: async (data) => {
    const r = await fetch(`${API_URL}/api/vacation-policies`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create policy');
    }
    return r.json();
  },
  update: async (id, data) => {
    const r = await fetch(`${API_URL}/api/vacation-policies/${id}`, {
      method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error('Failed to update policy');
    return r.json();
  },
  delete: async (id) => {
    const r = await fetch(`${API_URL}/api/vacation-policies/${id}`, {
      method: 'DELETE', headers: getAuthHeaders(),
    });
    if (!r.ok) throw new Error('Failed to delete policy');
    return r.json();
  },
};

// Vacation Holidays API
export const vacationHolidaysAPI = {
  list: async () => {
    const r = await fetch(`${API_URL}/api/vacation-holidays`, { headers: getAuthHeaders() });
    if (!r.ok) throw new Error('Failed to fetch holidays');
    return r.json();
  },
  create: async (data) => {
    const r = await fetch(`${API_URL}/api/vacation-holidays`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create holiday');
    }
    return r.json();
  },
  update: async (id, data) => {
    const r = await fetch(`${API_URL}/api/vacation-holidays/${id}`, {
      method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error('Failed to update holiday');
    return r.json();
  },
  delete: async (id) => {
    const r = await fetch(`${API_URL}/api/vacation-holidays/${id}`, {
      method: 'DELETE', headers: getAuthHeaders(),
    });
    if (!r.ok) throw new Error('Failed to delete holiday');
    return r.json();
  },
};

// Empleado A Evaluations API
export const empleadoAAPI = {
  // Plans
  getPlans: async () => {
    const response = await fetch(`${API_URL}/api/empleado-a/plans`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch Empleado A plans');
    return response.json();
  },

  getPlan: async (id) => {
    const response = await fetch(`${API_URL}/api/empleado-a/plans/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch Empleado A plan');
    return response.json();
  },

  createPlan: async (data) => {
    const response = await fetch(`${API_URL}/api/empleado-a/plans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create Empleado A plan');
    return response.json();
  },

  deletePlan: async (id) => {
    const response = await fetch(`${API_URL}/api/empleado-a/plans/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete Empleado A plan');
    return response.json();
  },

  updatePlan: async (id, data) => {
    const response = await fetch(`${API_URL}/api/empleado-a/plans/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update Empleado A plan');
    return response.json();
  },

  // Votes
  submitVote: async (planId, voteData) => {
    const response = await fetch(`${API_URL}/api/empleado-a/plans/${planId}/vote`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(voteData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to submit vote');
    }
    return response.json();
  },

  getMyPendingEvaluations: async () => {
    const response = await fetch(`${API_URL}/api/empleado-a/my-pending-evaluations`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch pending evaluations');
    return response.json();
  },

  // Results
  getEmployeeResults: async (employeeId, period = null) => {
    const url = period 
      ? `${API_URL}/api/empleado-a/results/${employeeId}?period=${period}`
      : `${API_URL}/api/empleado-a/results/${employeeId}`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch employee results');
    return response.json();
  },

  getAllResults: async (period = null) => {
    const url = period 
      ? `${API_URL}/api/empleado-a/results?period=${period}`
      : `${API_URL}/api/empleado-a/results`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch all results');
    return response.json();
  },

  // Autoevaluación
  createAutoevaluacion: async (data) => {
    const response = await fetch(`${API_URL}/api/empleado-a/autoevaluacion`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create autoevaluacion');
    }
    return response.json();
  },

  getAutoevaluacion: async (employeeId, period = null) => {
    const url = period 
      ? `${API_URL}/api/empleado-a/autoevaluacion/${employeeId}?period=${period}`
      : `${API_URL}/api/empleado-a/autoevaluacion/${employeeId}`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch autoevaluacion');
    return response.json();
  }
};

