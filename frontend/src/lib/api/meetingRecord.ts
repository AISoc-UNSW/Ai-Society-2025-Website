import { MeetingRecordDetailResponse, MeetingRecordListResponse, TaskListResponse } from "../types";
import { apiFetch } from "./client";

/**
 * Get all meeting records with optional filters
 */
export async function getMeetingRecords(
  portfolioId?: number,
  startDate?: string,
  endDate?: string,
  hasRecording?: boolean,
  hasSummary?: boolean,
  skip: number = 0,
  limit: number = 100
): Promise<MeetingRecordListResponse[]> {
  const params = new URLSearchParams();
  
  if (portfolioId) params.append('portfolio_id', portfolioId.toString());
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (hasRecording !== undefined) params.append('has_recording', hasRecording.toString());
  if (hasSummary !== undefined) params.append('has_summary', hasSummary.toString());
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());

  const queryString = params.toString();
  const endpoint = queryString ? `/api/v1/meeting-records/?${queryString}` : '/api/v1/meeting-records/';
  
  return await apiFetch(endpoint, {
    method: "GET",
  });
}

/**
 * Get meeting record details by ID
 */
export async function getMeetingRecordById(meetingId: number): Promise<MeetingRecordDetailResponse> {
  return await apiFetch(`/api/v1/meeting-records/${meetingId}`, {
    method: "GET",
  });
}

/**
 * Get tasks related to a specific meeting
 */
export async function getTasksByMeeting(meetingId: number): Promise<TaskListResponse[]> {
  return await apiFetch(`/api/v1/tasks/meeting/${meetingId}`, {
    method: "GET",
  });
}

/**
 * Search meeting records by query
 */
export async function searchMeetingRecords(
  query: string,
  portfolioId?: number
): Promise<MeetingRecordListResponse[]> {
  const params = new URLSearchParams();
  params.append('q', query);
  if (portfolioId) params.append('portfolio_id', portfolioId.toString());

  return await apiFetch(`/api/v1/meeting-records/search/?${params.toString()}`, {
    method: "GET",
  });
} 