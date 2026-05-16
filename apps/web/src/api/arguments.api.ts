import type { ArgumentDto, CreateArgumentDto } from "@brainstorm/core";
import { httpClient } from "./http-client";

export async function listArgumentsForDebate(
  debateId: string,
): Promise<ArgumentDto[]> {
  const { data } = await httpClient.get<ArgumentDto[]>(
    `/debates/${debateId}/arguments`,
  );
  return data;
}

export async function createArgument(
  debateId: string,
  payload: CreateArgumentDto,
): Promise<ArgumentDto> {
  const { data } = await httpClient.post<ArgumentDto>(
    `/debates/${debateId}/arguments`,
    payload,
  );
  return data;
}
