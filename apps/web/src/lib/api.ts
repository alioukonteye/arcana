import { useAuth } from '@clerk/clerk-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface ApiOptions {
  method?: RequestMethod;
  body?: any;
  headers?: Record<string, string>;
}

export const useApi = () => {
  const { getToken } = useAuth();

  const request = async <T>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
    const token = await getToken();
    console.log('useApi Debug - Token:', token ? 'Found (' + token.substring(0, 10) + '...)' : 'MISSING/NULL');
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body) {
      config.body = options.body instanceof FormData ? options.body : JSON.stringify(options.body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      console.error('API Error Details:', {
        status: response.status,
        data
      });
      const errorMessage = data.details
        ? `${data.error}: ${data.message} (${data.details})`
        : data.message || data.error || 'Something went wrong';
      throw new Error(errorMessage);
    }

    return data;
  };

  return { request };
};
