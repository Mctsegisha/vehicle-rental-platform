export const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('token');

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000); // 15s timeout

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(id);

    const text = await response.text();
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Failed to parse JSON response:', text);
        data = {};
      }
    } else {
      data = {};
    }

    if (!response.ok) {
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API Error (non-JSON):', response.status, text);
        throw new Error(`Server error (${response.status}). Please try again later.`);
      }
      throw new Error(data.error || text || `API Request failed with status ${response.status}`);
    }

    return data;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    throw err;
  }
};
