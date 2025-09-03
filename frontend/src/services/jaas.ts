import api from './api';

interface JaaSTokenResponse {
    token: string;
    appId: string;
}

export const jaasAPI = {
    getToken: async (name: string, email: string): Promise<JaaSTokenResponse> => {
        const response = await api.post<JaaSTokenResponse>('/jaas-jwt/token', { name, email });
        return response.data;
    }
};

// Get JAAS app ID from environment
export const JAAS_APP_ID = process.env.REACT_APP_JAAS_APP_ID;
