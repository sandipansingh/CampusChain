export interface RoleRequest {
  id: number;
  applicant: string;
  requested_role: number;
  status: number; // 0: pending, 1: approved, 2: denied
}

export enum UserRole {
  Guest = 0,
  Student = 1,
  Merchant = 2,
  ClubOrganizer = 3,
  Admin = 4,
}

export interface University {
  id: number;
  name: string;
  location: string;
  description: string;
  admin: string;
  member_count: number;
}

export interface JoinRequest {
  id: number;
  university_id: number;
  applicant: string;
  status: number;
}
