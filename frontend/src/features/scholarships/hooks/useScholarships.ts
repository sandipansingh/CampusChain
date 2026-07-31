import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchScholarshipProgram,
  fetchScholarshipPrograms,
  fetchScholarshipApplications,
  fetchScholarshipApplication,
  executeCreateScholarshipProgram,
  executeApplyForScholarship,
  executeReviewScholarshipApplication,
  executeDisburseScholarship,
} from "../service/scholarships";

export function useScholarshipProgram(programId: number | null, address?: string) {
  return useQuery({
    queryKey: ["scholarship-program", programId, address],
    queryFn: async () => {
      if (programId === null) return null;
      try {
        return await fetchScholarshipProgram(programId, address);
      } catch (err) {
        console.warn("Failed to fetch scholarship program, returning null", err);
        return null;
      }
    },
    enabled: programId !== null,
  });
}

export function useScholarshipApplication(applicationId: number | null, address?: string) {
  return useQuery({
    queryKey: ["scholarship-application", applicationId, address],
    queryFn: async () => {
      if (applicationId === null) return null;
      try {
        return await fetchScholarshipApplication(applicationId, address);
      } catch (err) {
        console.warn("Failed to fetch scholarship application, returning null", err);
        return null;
      }
    },
    enabled: applicationId !== null,
  });
}

export function useScholarshipPrograms(address?: string) {
  return useQuery({ queryKey: ["scholarship-programs", address], queryFn: () => fetchScholarshipPrograms(0, 50, address) });
}

export function useScholarshipApplications(address?: string) {
  return useQuery({ queryKey: ["scholarship-applications", address], queryFn: () => fetchScholarshipApplications(0, 50, address) });
}

export function useCreateScholarshipProgramMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      admin,
      universityCode,
      name,
      amount,
      minGpa,
    }: {
      admin: string;
      universityCode: string;
      name: string;
      amount: number;
      minGpa: number;
    }) => {
      return executeCreateScholarshipProgram(admin, universityCode, name, amount, minGpa);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholarship-programs"] });
    },
  });
}

export function useApplyForScholarshipMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      applicant,
      programId,
      gpa,
    }: {
      applicant: string;
      programId: number;
      gpa: number;
    }) => {
      return executeApplyForScholarship(applicant, programId, gpa);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholarship-applications"] });
    },
  });
}

export function useReviewScholarshipApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      admin,
      applicationId,
      approved,
    }: {
      admin: string;
      applicationId: number;
      approved: boolean;
    }) => {
      return executeReviewScholarshipApplication(admin, applicationId, approved);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["scholarship-application", variables.applicationId] });
      queryClient.invalidateQueries({ queryKey: ["scholarship-applications"] });
    },
  });
}

export function useDisburseScholarshipMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      admin,
      applicationId,
    }: {
      admin: string;
      applicationId: number;
    }) => {
      return executeDisburseScholarship(admin, applicationId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["scholarship-application", variables.applicationId] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance"] });
    },
  });
}
