import axios from "axios";

// base axios instance
const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await supabase.auth.refreshSession();
        const token = data?.session?.access_token;

        if (token) {
          localStorage.setItem(ACCESS_TOKEN_KEY, token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        const currentPath = window.location.pathname;

        if (
          currentPath !== '/login' &&
          currentPath !== '/register' &&
          currentPath !== '/'
        ) {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ================= AUTH =================

export const authAPI = {
  getMe: () => api.get('/api/auth/me'),
  loginBackend: (email) => api.post('/api/auth/login', { email }),
};

// ================= USER =================

export const userAPI = {
  getUsers: (params = {}) => api.get('/api/users', { params }),
  getUser: (userId) => api.get(`/api/users/${userId}`),
  updateUser: (userId, data) => api.put(`/api/users/${userId}`, data),
  getUserApplications: (userId) =>
    api.get(`/api/users/${userId}/applications`),
};

// ================= PROJECT =================

export const projectAPI = {

  // CREATE PROJECT
  createProject: async (data) => {

    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData?.session?.user?.id

    const { data: result, error } = await supabase
      .from('projects')
      .insert([
        {
          ...data,
          owner_id: userId
        }
      ])
      .select()
      .single()

    if (error) {
      console.error("Create project error:", error)
      throw error
    }

    return { data: result }
  },

  // GET ALL PROJECTS
  getProjects: async () => {

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data: { projects: data || [] } }
  },

  // GET SINGLE PROJECT
  getProject: async (projectId) => {

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) throw error

    return { data }
  },

  // PROJECTS I OWN
  getMyLeadingProjects: async () => {

    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData?.session?.user?.id

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', userId)

    if (error) throw error

    return { data: { projects: data || [] } }
  },

  // PROJECTS I JOINED
  getMyCollaboratingProjects: async () => {

    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData?.session?.user?.id

    const { data, error } = await supabase
      .from('project_members')
      .select('projects(*)')
      .eq('user_id', userId)

    if (error) throw error

    return {
      data: {
        projects: data?.map(p => p.projects) || []
      }
    }
  },
};

// ================= APPLICATION =================

export const applicationAPI = {
  createApplication: (data) => api.post('/api/applications', data),
  updateApplication: (applicationId, data) =>
    api.put(`/api/applications/${applicationId}`, data),
  deleteApplication: (applicationId) =>
    api.delete(`/api/applications/${applicationId}`),
};

// ================= SEARCH =================

export const searchAPI = {
  searchProjects: (query, params = {}) =>
    api.get('/api/search/projects', { params: { q: query, ...params } }),
  searchUsers: (query, params = {}) =>
    api.get('/api/search/users', { params: { q: query, ...params } }),
};

// ================= MESSAGE =================

export const messageAPI = {
  sendMessage: (projectId, data) =>
    api.post(`/api/projects/${projectId}/messages`, data),

  getMessages: (projectId, params = {}) =>
    api.get(`/api/projects/${projectId}/messages`, { params }),
};

// ================= STATIC =================

export const staticAPI = {
  getSkills: () => api.get('/api/skills'),
  getUniversities: () => api.get('/api/universities'),
  getCategories: () => api.get('/api/categories'),
  getStats: () => api.get('/api/stats'),
};

// ================= FILE =================

export const uploadAPI = {
  uploadFile: (file, projectId) => {

    const formData = new FormData();
    formData.append('file', file);

    return api.post(`/api/upload/file?project_id=${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ================= HEALTH =================

export const healthAPI = {
  check: () => api.get('/health'),
};
// ============ VERSION CONTROL ============

export const vcsAPI = {

  connectRepository: async () => {
    return { data: null }
  },

  getRepository: async () => {
    return { data: null }
  },

  disconnectRepository: async () => {
    return { data: null }
  },

  getCommits: async () => {
    return { data: [] }
  },

  getPullRequests: async () => {
    return { data: [] }
  },

  getStats: async () => {
    return { data: null }
  }

};
// ============ DOCUMENT COLLABORATION ============

export const documentAPI = {

  createDocument: async () => {
    return { data: null }
  },

  getDocuments: async () => {
    return { data: [] }
  },

  getDocument: async () => {
    return { data: null }
  },

  updateDocument: async () => {
    return { data: null }
  },

  deleteDocument: async () => {
    return { data: null }
  },

  createFolder: async () => {
    return { data: null }
  },

  getFolders: async () => {
    return { data: [] }
  }

};
// ============ MEETINGS & CALLS ============

export const meetingAPI = {

  createMeeting: async () => {
    return { data: null }
  },

  getMeetings: async () => {
    return { data: [] }
  },

  updateMeeting: async () => {
    return { data: null }
  },

  deleteMeeting: async () => {
    return { data: null }
  },

  joinMeeting: async () => {
    return { data: null }
  },

  createInstantCall: async () => {
    return { data: null }
  }

};


export default api;