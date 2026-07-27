export interface ScholarshipProgram {
  id: number;
  name: string;
  amount: number;
  sponsor: string;
  min_gpa: number;
  active: boolean;
}

export interface ScholarshipApplication {
  id: number;
  program_id: number;
  applicant: string;
  gpa: number;
  status: number; // 0: Pending, 1: Approved, 2: Denied, 3: Disbursed
}
