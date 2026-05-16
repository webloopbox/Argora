import type {
  CreateDebateDto,
  DebateDetailDto,
  DebatePreviewDto,
} from "@brainstorm/core";
import { httpClient } from "./http-client";

export async function listPublicDebates(): Promise<DebatePreviewDto[]> {
  const { data } = await httpClient.get<DebatePreviewDto[]>("/debates");
  return data;
}

export async function listGroupDebates(
  groupId: string,
): Promise<DebatePreviewDto[]> {
  const { data } = await httpClient.get<DebatePreviewDto[]>("/debates", {
    params: { groupId },
  });
  return data;
}

export async function fetchDebateDetail(id: string): Promise<DebateDetailDto> {
  const { data } = await httpClient.get<DebateDetailDto>(`/debates/${id}`);
  return data;
}

export async function createDebate(
  payload: CreateDebateDto,
): Promise<DebateDetailDto> {
  const { data } = await httpClient.post<DebateDetailDto>("/debates", payload);
  return data;
}
