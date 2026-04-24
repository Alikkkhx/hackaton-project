export type UserRole = "seeker" | "employer" | "admin";

export type EmploymentType = "full_time" | "part_time" | "gig" | "internship";
export type ExperienceLevel =
  | "student"
  | "no_exp"
  | "junior"
  | "middle"
  | "senior";
export type ApplicationStatus = "pending" | "viewed" | "accepted" | "rejected";

export interface User {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  phone_verified: boolean;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SeekerProfile {
  id: string;
  headline: string;
  about: string;
  city: string;
  district: string | null;
  experience: ExperienceLevel;
  skills: string[];
  desired_employment: EmploymentType[];
  updated_at: string;
}

export interface EmployerProfile {
  id: string;
  company_name: string;
  description: string;
  industry: string | null;
  city: string;
  verified: boolean;
}

export interface Job {
  id: string;
  employer_id: string;
  employer_name: string | null;
  employer_verified: boolean;
  title: string;
  description: string;
  industry: string;
  city: string;
  district: string | null;
  employment_type: EmploymentType;
  experience: ExperienceLevel;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  skills: string[];
  contact: string;
  is_active: boolean;
  risk_score: number;
  risk_reasons: string[];
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  seeker_id: string;
  cover_letter: string;
  status: ApplicationStatus;
  created_at: string;
}

export interface ApplicationWithJob extends Application {
  job: Job;
}

export interface ApplicationWithSeeker extends Application {
  seeker: User;
  seeker_profile: SeekerProfile | null;
}

export interface MatchItem {
  job: Job;
  score: number;
  reason: string;
}

export interface MatchResponse {
  items: MatchItem[];
}
