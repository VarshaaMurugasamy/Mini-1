const API_BASE = '/api';

export const getToken = () => localStorage.getItem('helpdesk_token');
export const setToken = (token) => localStorage.setItem('helpdesk_token', token);
export const removeToken = () => localStorage.removeItem('helpdesk_token');

export const getCurrentUser = () => {
  const user = localStorage.getItem('helpdesk_user');
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user) => {
  localStorage.setItem('helpdesk_user', JSON.stringify(user));
};

export const removeCurrentUser = () => {
  localStorage.removeItem('helpdesk_user');
};

const authHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    setToken(data.token);
    setCurrentUser(data.user);
    return data;
  },

  async register(name, email, password, department) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, department })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    setToken(data.token);
    setCurrentUser(data.user);
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Session expired');
    setCurrentUser(data.user);
    return data.user;
  },

  // Tickets
  async getTickets(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/tickets${query ? `?${query}` : ''}`, {
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error fetching tickets');
    return data;
  },

  async getTicketById(id) {
    const res = await fetch(`${API_BASE}/tickets/${id}`, {
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Ticket not found');
    return data.ticket;
  },

  async createTicket(ticketData) {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(ticketData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error creating ticket');
    return data.ticket;
  },

  async updateTicketStatus(id, updateData) {
    const res = await fetch(`${API_BASE}/tickets/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(updateData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error updating status');
    return data.ticket;
  },

  async assignTicket(id, engineerId) {
    const res = await fetch(`${API_BASE}/tickets/${id}/assign`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ engineerId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error assigning ticket');
    return data.ticket;
  },

  async addComment(id, text, isInternal = false) {
    const res = await fetch(`${API_BASE}/tickets/${id}/comments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ text, isInternal })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error adding comment');
    return data.comments;
  },

  async reclassifyTicket(id) {
    const res = await fetch(`${API_BASE}/tickets/${id}/reclassify`, {
      method: 'POST',
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error re-classifying ticket');
    return data;
  },

  // Dashboard & Admin
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/stats/dashboard`, {
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error loading dashboard statistics');
    return data.stats;
  },

  async getEngineers() {
    const res = await fetch(`${API_BASE}/users/engineers`, {
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error fetching engineers');
    return data.engineers;
  },

  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/users${query ? `?${query}` : ''}`, {
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error fetching users');
    return data.users;
  },

  async updateUserRole(id, role) {
    const res = await fetch(`${API_BASE}/users/${id}/role`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error updating user role');
    return data.user;
  }
};
