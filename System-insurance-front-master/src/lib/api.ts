import axios from "axios";
import { getSession } from "next-auth/react";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session && (session as any).accessToken) {
    config.headers.Authorization = `Bearer ${(session as any).accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// API funksiyaları
export const authApi = {
  login: (email: string, password: string) => api.post("/api/auth/login", { email, password }),
  getMe: () => api.get("/api/auth/me"),
  getAgents: () => api.get("/api/auth/agents"),
  createAgent: (data: any) => api.post("/api/auth/agents", data),
  updateAgent: (id: number, data: any) => api.put(`/api/auth/agents/${id}`, data),
};

export const policiesApi = {
  getAll: () => api.get("/api/policies"),
  getOne: (id: number) => api.get(`/api/policies/${id}`),
  create: (data: any) => api.post("/api/policies", data),
  update: (id: number, data: any) => api.put(`/api/policies/${id}`, data),
  delete: (id: number) => api.delete(`/api/policies/${id}`),
  previewPrice: (type: string, details: any) => api.post("/api/policies/preview-price", { type, details }),
};

export const paymentsApi = {
  getAll: (filters?: any) => api.get("/api/payments", { params: filters }),
  updateStatus: (id: number, status: string, payment_method?: string) =>
    api.put(`/api/payments/${id}/status`, { status, payment_method }),
  getStats: () => api.get("/api/payments/stats"),
};

export const reportsApi = {
  getSummary: () => api.get("/api/reports/summary"),
  getAgentReport: (id: number) => api.get(`/api/reports/agent/${id}`),
  exportExcel: (filters?: any) =>
    api.get("/api/reports/export", { params: { format: "excel", ...filters }, responseType: "blob" }),
  exportPDF: (filters?: any) =>
    api.get("/api/reports/export", { params: { format: "pdf", ...filters }, responseType: "blob" }),
  exportAgentPDF: (id: number) =>
    api.get(`/api/reports/agent/${id}/export`, { params: { format: "pdf" }, responseType: "blob" }),
  exportAgentExcel: (id: number) =>
    api.get(`/api/reports/agent/${id}/export`, { params: { format: "excel" }, responseType: "blob" }),
};

export const pricingRulesApi = {
  getAll: () => api.get("/api/pricing-rules"),
  create: (data: any) => api.post("/api/pricing-rules", data),
  update: (id: number, data: any) => api.put(`/api/pricing-rules/${id}`, data),
  delete: (id: number) => api.delete(`/api/pricing-rules/${id}`),
  preview: (type: string, details: any) => api.post("/api/pricing-rules/preview", { type, details }),
};
