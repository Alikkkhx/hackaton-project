import type {
  Application,
  ApplicationWithJob,
  ApplicationWithSeeker,
  AuthToken,
  EmployerProfile,
  Job,
  MatchResponse,
  SeekerProfile,
  User,
} from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

const TOKEN_KEY = "jumysaq_token";
const USER_KEY = "jumysaq_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuth(token: string, user: User) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data?.detail) message = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    } catch {}
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  // auth
  register: (payload: {
    full_name: string;
    email?: string;
    phone?: string;
    password: string;
    role: "seeker" | "employer";
  }) =>
    request<AuthToken>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: { login: string; password: string }) =>
    request<AuthToken>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: () => request<User>("/api/users/me"),

  // seeker profile
  getSeekerProfile: () =>
    request<SeekerProfile>("/api/users/me/seeker-profile"),
  saveSeekerProfile: (p: Partial<SeekerProfile>) =>
    request<SeekerProfile>("/api/users/me/seeker-profile", {
      method: "PUT",
      body: JSON.stringify(p),
    }),

  // employer profile
  getEmployerProfile: () =>
    request<EmployerProfile>("/api/users/me/employer-profile"),
  saveEmployerProfile: (p: Partial<EmployerProfile>) =>
    request<EmployerProfile>("/api/users/me/employer-profile", {
      method: "PUT",
      body: JSON.stringify(p),
    }),

  // jobs
  listJobs: (params: Record<string, string | number | undefined | null> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const q = qs.toString();
    return request<Job[]>(`/api/jobs${q ? `?${q}` : ""}`);
  },
  getJob: (id: string) => request<Job>(`/api/jobs/${id}`),
  createJob: (payload: Partial<Job>) =>
    request<Job>("/api/jobs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  myJobs: () => request<Job[]>("/api/jobs/mine/all"),
  deleteJob: (id: string) =>
    request<void>(`/api/jobs/${id}`, { method: "DELETE" }),

  // applications
  apply: (payload: { job_id: string; cover_letter: string }) =>
    request<Application>("/api/applications", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  myApplications: () =>
    request<ApplicationWithJob[]>("/api/applications/mine"),
  applicationsForJob: (jobId: string) =>
    request<ApplicationWithSeeker[]>(`/api/applications/for-job/${jobId}`),
  updateApplicationStatus: (id: string, status: string) =>
    request<Application>(
      `/api/applications/${id}/status?status=${status}`,
      { method: "PATCH" }
    ),

  // match
  matchForMe: (limit = 10, explain = true) =>
    request<MatchResponse>(
      `/api/match/for-me?limit=${limit}&explain=${explain}`
    ),
};
