import axios from 'axios';

const api = axios.create({
  baseURL: 'https://hunters-api-gnyg.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Check for admin token first, then regular user token
    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('token');
    
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 unauthorized, clear tokens and redirect
    if (error.response?.status === 401) {
      const isAdmin = localStorage.getItem('adminToken');
      if (isAdmin) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUsername');
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login';
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ===== AUTH API =====
export const authApi = {
  // Discord OAuth
  loginWithDiscord: () => {
    window.location.href = `${api.defaults.baseURL}/api/auth/discord`;
  },
  
  // Discord callback
  discordCallback: (code: string) => api.post('/api/auth/discord/callback', { code }),
  
  // Get current user
  getMe: () => api.get('/api/auth/me'),
};

// ===== ACCOUNTS API =====
export const accountsApi = {
  getAll: () => api.get('/api/accounts'),
  add: (token: string) => api.post('/api/accounts', { token }),
  remove: (id: string) => api.delete(`/api/accounts/${id}`),
  getToken: (id: string) => api.get(`/api/accounts/${id}/token`),
};

// ===== CAMPAIGNS API =====
export const campaignsApi = {
  getAll: () => api.get('/api/campaigns'),
  create: (data: any) => api.post('/api/campaigns', data),
  updateStatus: (id: string, status: string) => api.patch(`/api/campaigns/${id}/status`, { status }),
  remove: (id: string) => api.delete(`/api/campaigns/${id}`),
};

// ===== BILLING API =====
export const billingApi = {
  getPrices: () => api.get('/api/billing/prices'),
  generateAddress: (plan: string) => api.post('/api/billing/generate-address', { plan }),
  verifyPayment: (subscriptionId: string, txId: string) => api.post('/api/billing/verify', { subscriptionId, txId }),
  startTrial: () => api.post('/api/billing/trial'),
};

// ===== ADMIN AUTH API =====
export const adminAuthApi = {
  login: (username: string, password: string) => api.post('/api/admin/auth/login', { username, password }),
  changePassword: (username: string, currentPassword: string, newPassword: string) => 
    api.post('/api/admin/auth/change-password', { username, currentPassword, newPassword }),
};

// ===== ADMIN DASHBOARD API =====
export const adminApi = {
  // Overview
  getOverview: () => api.get('/api/admin/overview'),
  
  // Users
  getUsers: (page: number = 1, limit: number = 20, search: string = '') => 
    api.get(`/api/admin/users?page=${page}&limit=${limit}&search=${search}`),
  getUser: (id: string) => api.get(`/api/admin/users/${id}`),
  updateUserPlan: (id: string, plan: string) => api.patch(`/api/admin/users/${id}/plan`, { plan }),
  resetUserTrial: (id: string) => api.patch(`/api/admin/users/${id}/reset-trial`),
  deleteUser: (id: string) => api.delete(`/api/admin/users/${id}`),
  
  // Accounts
  getAccounts: (page: number = 1, limit: number = 30) => 
    api.get(`/api/admin/accounts?page=${page}&limit=${limit}`),
  
  // Campaigns
  getCampaigns: (page: number = 1, limit: number = 30) => 
    api.get(`/api/admin/campaigns?page=${page}&limit=${limit}`),
  updateCampaignStatus: (id: string, status: string) => 
    api.patch(`/api/admin/campaigns/${id}/status`, { status }),
  deleteCampaign: (id: string) => api.delete(`/api/admin/campaigns/${id}`),
  
  // Subscriptions
  getSubscriptions: (page: number = 1, limit: number = 30) => 
    api.get(`/api/admin/subscriptions?page=${page}&limit=${limit}`),
  
  // Prices
  getPrices: () => api.get('/api/admin/prices'),
  updatePrices: (prices: any) => api.post('/api/admin/prices', { prices }),
  
  // LTC Address
  getLtcAddress: () => api.get('/api/admin/ltc-address'),
  updateLtcAddress: (address: string, label: string) => api.post('/api/admin/ltc-address', { address, label }),
  
  // System Status
  getStatus: () => api.get('/api/admin/status'),
};

// ===== UTILITY FUNCTIONS =====
export const utils = {
  // Format date
  formatDate: (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },
  
  // Format date with time
  formatDateTime: (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
  
  // Truncate text
  truncate: (text: string, length: number = 50) => {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
  },
  
  // Copy to clipboard
  copyToClipboard: async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  },
};

export default api;
