import api from './api';

interface JitsiTokenResponse {
  token: string;
  appId: string;
  roomName: string;
}

interface JaaSTokenResponse {
  token: string;
  appId: string;
}

interface TokenRequest {
  room: string;
  user_name: string;
  is_moderator?: boolean;
}

export const jaasAPI = {
  getToken: async (name: string, email: string): Promise<JaaSTokenResponse> => {
    const response = await api.post<JaaSTokenResponse>('/jaas-jwt/token', { name, email });
    return response.data;
  }
};

export const jitsiAPI = {
  getToken: async (data: TokenRequest): Promise<JitsiTokenResponse> => {
    const response = await api.post<JitsiTokenResponse>('/jaas/token', data);
    return response.data;
  }
};
