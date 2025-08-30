// API Configuration
// Use relative path for API calls when running in production (behind nginx proxy)
// Use absolute path for development
const API_BASE_URL = (window as any).env?.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

// Create axios-like API instance
const api = {
  get: async <T>(endpoint: string, options: ApiRequestOptions = {}): Promise<{ data: T }> => {
    const response = await apiRequest(endpoint, { ...options, method: 'GET' });
    return { data: response };
  },
  post: async <T>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<{ data: T }> => {
    const response = await apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: response };
  },
  put: async <T>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<{ data: T }> => {
    const response = await apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: response };
  },
  delete: async <T>(endpoint: string, options: ApiRequestOptions = {}): Promise<{ data: T }> => {
    const response = await apiRequest(endpoint, { ...options, method: 'DELETE' });
    return { data: response };
  },
  // Special method for file uploads with FormData
  upload: async <T>(endpoint: string, formData: FormData, options: ApiRequestOptions = {}): Promise<{ data: T }> => {
    const response = await apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    });
    return { data: response };
  },
};

// Fetch wrapper with auth and error handling
interface ApiRequestOptions extends RequestInit {
  responseType?: 'json' | 'blob' | 'text';
}
const apiRequest = async (endpoint: string, options: ApiRequestOptions = {}): Promise<any> => {
  const token = localStorage.getItem('access_token');
  
  // For file uploads, don't set Content-Type header - let the browser set it automatically
  const headers: Record<string, string> = {};
  
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config: ApiRequestOptions = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/';
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    
    if (options.responseType === 'blob') {
      return await response.blob();
    } else if (options.responseType === 'text') {
      return await response.text();
    } else {
      return await response.json();
    }
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

// Types
export interface User {
  id: number;
  email: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
}

export interface Claim {
  id: number;
  claim_number: string;
  patient_mobile: string;
  hospital_city: string;
  hospital_state: string;
  language: string;
  status: string;
  created_at: string;
}

export interface VideoCallRequest {
  claimId: string;
  patientName?: string;
  procedure?: string;
}

export interface VideoCallResponse {
  success: boolean;
  sessionId: string;
  roomName: string;
  roomUrl: string;
  patientUrl: string;
  moderatorToken?: string;
  patientToken?: string;
  smsSent: boolean;
  message: string;
}

export interface FormSubmissionRequest {
  session_id: string;
  full_name: string;
  email: string;
  phone: string;
  policy_number?: string;
  message?: string;
  latitude?: number;
  longitude?: number;
  geo_accuracy_m?: number;
}

export interface ReportGenerationRequest {
  claim_id: number;
  recipient_email: string;
  form_data?: Record<string, any>;
}

export interface JitsiTokenRequest {
  roomName: string;
  userName: string;
  userEmail: string;
  isModerator?: boolean;
}

export interface JitsiTokenResponse {
  token: string;
  roomName: string;
  userName: string;
  expiresAt: string;
}

// Authentication API
export const authAPI = {
  register: async (email: string, password: string): Promise<AuthResponse> => {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    return await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async (): Promise<void> => {
    await apiRequest('/auth/logout', { method: 'POST' });
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
};

// Claims API
export const claimsAPI = {
  getAll: async (): Promise<Claim[]> => {
    const response = await api.get<Claim[]>('/claims');
    return response.data;
  },

  getById: async (id: number): Promise<Claim> => {
    const response = await api.get<Claim>(`/claims/${id}`);
    return response.data;
  },

  create: async (claimData: {
    claim_number: string;
    patient_mobile: string;
    hospital_city: string;
    hospital_state: string;
    language: string;
  }): Promise<Claim> => {
    const response = await api.post<Claim>('/claims', claimData);
    return response.data;
  },

  update: async (id: number, claimData: Partial<Claim>): Promise<Claim> => {
    const response = await api.put<Claim>(`/claims/${id}`, claimData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/claims/${id}`);
  },
};

// Video Call API
export const videoCallAPI = {
  create: async (request: VideoCallRequest): Promise<VideoCallResponse> => {
    const response = await api.post<VideoCallResponse>('/meetings/video-call/create', request);
    return response.data;
  },

  getStatus: async (sessionId: string): Promise<{
    sessionId: string;
    status: string;
    roomName: string;
    createdAt: string;
    patientName?: string;
    procedure?: string;
  }> => {
    const response = await api.get<{
      sessionId: string;
      status: string;
      roomName: string;
      createdAt: string;
      patientName?: string;
      procedure?: string;
    }>(`/meetings/video-call/status/${sessionId}`);
    return response.data;
  },

  updateStatus: async (sessionId: string, status: string): Promise<void> => {
    await api.put(`/meetings/video-call/status/${sessionId}`, { status });
  },

  complete: async (sessionId: string): Promise<{ message: string; sessionId: string }> => {
    const response = await api.post<{ message: string; sessionId: string }>(`/meetings/video-call/complete/${sessionId}`);
    return response.data;
  },
};

// JAAS API
export const jaasAPI = {
  getToken: async (room: string, user: string, moderator: boolean = true): Promise<{ token: string }> => {
    const query = new URLSearchParams({ room, user, moderator: moderator.toString() }).toString();
    const response = await api.get<{ token: string }>(`/jaas/8x8-token?${query}`);
    return response.data;
  },
};

// SMS API
export const smsAPI = {
  send: async (phoneNumber: string, message: string, claimId?: string): Promise<{
    success: boolean;
    message: string;
    message_id?: string;
  }> => {
    const response = await api.post<{
      success: boolean;
      message: string;
      message_id?: string;
    }>('/meetings/send-sms', {
      phone_number: phoneNumber,
      message: message,
      claim_id: claimId
    });
    return response.data;
  },
};

// Jitsi Token API (Note: This endpoint may not be implemented in the backend)
// The JWT token is typically generated by the create_video_call endpoint
export const getJitsiToken = async (
  roomName: string,
  userName: string,
  userEmail: string,
  isModerator: boolean = false
): Promise<JitsiTokenResponse> => {
  // This is a placeholder function - the actual JWT token should come from the video call creation
  // For now, we'll return a mock response or throw an error
  throw new Error('Jitsi token endpoint not implemented. Use videoCallAPI.create instead.');
};

// Forms API
export const formsAPI = {
  submit: async (formData: FormSubmissionRequest): Promise<{
    success: boolean;
    form_id: number;
    session_id: string;
    message: string;
  }> => {
    const response = await api.post<{
      success: boolean;
      form_id: number;
      session_id: string;
      message: string;
    }>('/forms/submit', formData);
    return response.data;
  },

  generateReport: async (request: ReportGenerationRequest): Promise<{
    success: boolean;
    claim_number: string;
    report_generated: boolean;
    email_sent: boolean;
    pdf_file_path: string;
    s3_url?: string;
    recipient_email: string;
    verification_status: string;
    message: string;
  }> => {
    const response = await api.post<{
      success: boolean;
      claim_number: string;
      report_generated: boolean;
      email_sent: boolean;
      pdf_file_path: string;
      s3_url?: string;
      recipient_email: string;
      verification_status: string;
      message: string;
    }>('/forms/generate-report', request);
    return response.data;
  },

  getClaimSummary: async (claimId: number): Promise<{
    success: boolean;
    claim: Claim;
    meetings_count: number;
    recordings_count: number;
    verification_status: string;
    has_completed_meeting: boolean;
    has_recording: boolean;
    has_geolocation: boolean;
    latest_meeting?: any;
    latest_recording?: any;
  }> => {
    const response = await api.get<{
      success: boolean;
      claim: Claim;
      meetings_count: number;
      recordings_count: number;
      verification_status: string;
      has_completed_meeting: boolean;
      has_recording: boolean;
      has_geolocation: boolean;
      latest_meeting?: any;
      latest_recording?: any;
    }>(`/forms/claim-summary/${claimId}`);
    return response.data;
  },
};

// S3 File Upload API
export const s3API = {
  uploadFile: async (file: File, claimId?: string): Promise<{ url: string; key: string; filename: string; claim_id?: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (claimId) {
      formData.append('claim_id', claimId);
    }
    
    const response = await api.upload<{ url: string; key: string; filename: string; claim_id?: string }>('/s3/upload', formData);
    return response.data;
  },
};

// Recordings API
export const recordingsAPI = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/recordings');
    return response.data;
  },

  getById: async (id: number): Promise<any> => {
    const response = await api.get<any>(`/recordings/${id}`);
    return response.data;
  },

  updateGeolocation: async (id: number, geoData: {
    latitude: number;
    longitude: number;
    geo_accuracy_m?: number;
  }): Promise<any> => {
    const response = await api.put<any>(`/recordings/${id}/geolocation`, geoData);
    return response.data;
  },
};

// Geolocation utilities
export const geolocationAPI = {
  getCurrentPosition: (): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  },
};

// Utility functions
export const setAuthToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const setUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Health check
export const healthCheck = async (): Promise<{ status: string; message: string }> => {
  const response = await api.get<{ status: string; message: string }>('/health');
  return response.data;
};

// Legacy functions for backward compatibility
export const submitForm = async (formData: any) => {
  return await formsAPI.submit(formData);
};

export const getFormData = async () => {
  return await formsAPI.getClaimSummary(1); // Default claim ID
};

export const generatePdf = async (data: ReportGenerationRequest): Promise<Blob> => {
  const response = await api.post<Blob>('/forms/generate-report', data, { responseType: 'blob' });
  return response.data;
};

export const sendEmail = async (data: any) => {
  return await formsAPI.generateReport(data);
};

export default api;
