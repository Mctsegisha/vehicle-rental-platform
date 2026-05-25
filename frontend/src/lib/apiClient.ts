export const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('token');

export const apiFetch = async (endpoint: string, options: RequestInit = {}, retries = 2, delayMs = 1200): Promise<any> => {
  const token = getAuthToken();
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 60000); // 60s timeout to survive cold starts and remote db latency

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
      // If we got a transient 502/503/504 gateway error (like server reloading/booting), retry
      if ((response.status === 502 || response.status === 503 || response.status === 504) && retries > 0) {
        console.warn(`[API Client] Received gateway status ${response.status}. Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return apiFetch(endpoint, options, retries - 1, delayMs * 1.5);
      }

      if (!contentType || !contentType.includes('application/json')) {
        console.error('API Error (non-JSON):', response.status, text);
        throw new Error(`Server error (${response.status}). Please try again later.`);
      }
      throw new Error(data.error || text || `API Request failed with status ${response.status}`);
    }

    return data;
  } catch (err: any) {
    clearTimeout(id);
    
    // Check if we should retry on classic transient network/fetch errors (like "Failed to fetch")
    const isNetworkError = err.name === 'TypeError' || err.message === 'Failed to fetch';
    if (isNetworkError && retries > 0) {
      console.warn(`[API Client] Transient network warning: ${err.message}. Retrying in ${delayMs}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return apiFetch(endpoint, options, retries - 1, delayMs * 1.5);
    }

    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    throw err;
  }
};
