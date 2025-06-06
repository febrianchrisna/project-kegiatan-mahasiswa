import axios from 'axios';

const API_BASE_URL = 'https://be-project-tcc-663618957788.us-central1.run.app'; // Fix: Add http protocol

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // Increase to 2 minutes for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh for download endpoints that might be streaming
    if (originalRequest.url && originalRequest.url.includes('/download')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });

        const { accessToken } = refreshResponse.data;
        localStorage.setItem('accessToken', accessToken);
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api.request(originalRequest);
      } catch (refreshError) {
        // Refresh token is invalid, redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  registerStudent: (data) => api.post('/auth/register/student', data),
  registerAdmin: (data) => api.post('/auth/register/admin', data),
  registerPublic: (data) => api.post('/auth/register/public', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  refreshToken: () => api.post('/auth/refresh'),
};

// Activities API
export const activitiesAPI = {
  getAll: (params) => api.get('/activities', { params }),
  getById: (id) => api.get(`/activities/${id}`),
  create: (data) => api.post('/activities', data),
  update: (id, data) => api.put(`/activities/${id}`, data),
  delete: (id) => api.delete(`/activities/${id}`),
  approve: (id, data) => api.put(`/admin/activities/${id}/approve`, data),
  reject: (id, data) => api.put(`/admin/activities/${id}/reject`, data),
  getStats: () => api.get('/admin/activities/stats'),
};

// Proposals API
export const proposalsAPI = {
  getAll: (params) => api.get('/proposals', { params }),
  getById: (id) => api.get(`/proposals/${id}`),
  create: (data) => api.post('/proposals', data),
  update: (id, data) => api.put(`/proposals/${id}`, data),
  delete: (id) => api.delete(`/proposals/${id}`),
  upload: (formData) => api.post('/proposals/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateFile: (id, formData) => api.put(`/proposals/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  submit: (id) => api.put(`/proposals/${id}/submit`),
  review: (id, data) => api.put(`/admin/proposals/${id}/review`, data),
  getStats: () => api.get('/admin/proposals/stats'),
  download: (id) => {
    // Return the authenticated download URL
    const token = localStorage.getItem('accessToken');
    return `http://localhost:5000/proposals/${id}/download?token=${encodeURIComponent(token)}`;
  },
  downloadPublic: (id) => {
    // Return the public download URL (no authentication needed)
    return `http://localhost:5000/public/proposals/${id}/download`;
  }
};

// Admin API
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  getActivities: (params) => api.get('/admin/activities', { params }),
  getProposals: (params) => api.get('/admin/proposals', { params }),
};

export default api;
