import type {
  CreateDebateDto,
  DebateDetailDto,
  DebatePreviewDto,
} from "@brainstorm/core";
import { httpClient } from "./http-client";

export async function listPublicDebates(): Promise<DebatePreviewDto[]> {
  const { data } = await httpClient.get<DebatePreviewDto[]>("/debates", {
    silent: true,
  });
  return data;
}

export async function listGroupDebates(
  groupId: string,
): Promise<DebatePreviewDto[]> {
  const { data } = await httpClient.get<DebatePreviewDto[]>("/debates", {
    params: { groupId },
    silent: true,
  });
  return data;
}

// Detail page handles 404/403/error states with dedicated UI - toast would
// be noise on top.
export async function fetchDebateDetail(id: string): Promise<DebateDetailDto> {
  const { data } = await httpClient.get<DebateDetailDto>(`/debates/${id}`, {
    silent: true,
  });
  return data;
}

export async function createDebate(
  payload: CreateDebateDto,
): Promise<DebateDetailDto> {
  const { data } = await httpClient.post<DebateDetailDto>("/debates", payload);
  return data;
}

export async function deleteDebate(id: string): Promise<void> {
  await httpClient.delete(`/debates/${id}`);
}
