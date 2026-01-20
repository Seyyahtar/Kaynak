const API_BASE_URL = '/api';

export const api = {
    async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        };

        const response = await fetch(url, defaultOptions);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API Error: ${response.status}`);
        }

        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    },

    get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        return this.fetch<T>(endpoint, { ...options, method: 'GET' });
    },

    post<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
        return this.fetch<T>(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    put<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
        return this.fetch<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
    },
};
