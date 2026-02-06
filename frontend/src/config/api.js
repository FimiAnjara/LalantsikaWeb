// Configuration de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export { API_BASE_URL };
export const API_URL = `${API_BASE_URL}/api`;

// Endpoints
export const ENDPOINTS = {
    // Authwcw
    LOGIN: `${API_URL}/auth/login`,
    REGISTER: `${API_URL}/auth/register`,
    LOGOUT: `${API_URL}/auth/logout`,
    ME: `${API_URL}/auth/me`,
    REFRESH: `${API_URL}/auth/refresh`,

    // Users
    USERS: `${API_URL}/users`,
    USER: (id) => `${API_URL}/users/${id}`,
    USER_UNBLOCK: (id) => `${API_URL}/users/${id}/unblock`,
    USER_TYPES: `${API_URL}/user-types`,
    SEXES: `${API_URL}/sexes`,

    // Reports (Signalements)
    REPORTS: `${API_URL}/reports`,
    REPORTS_PUBLIC: `${API_URL}/public/reports`,
    REPORT: (id) => `${API_URL}/reports/${id}`,
    REPORT_HISTO: (id) => `${API_URL}/reports/${id}/histostatut`,

    // Statuses
    STATUSES: `${API_URL}/statuses`,

    // Companies
    COMPANIES: `${API_URL}/companies`,
};

// Helper pour les requêtes authentifiées
export const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
};

// Helper pour les requêtes sans Content-Type (pour FormData)
export const getAuthHeadersMultipart = () => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
    };
};

export default API_URL;
