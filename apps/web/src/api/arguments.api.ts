import type { ArgumentDto, CreateArgumentDto } from "@argora/core";
import { httpClient } from "./http-client";

export async function listArgumentsForDebate(
  debateId: string,
): Promise<ArgumentDto[]> {
  const { data } = await httpClient.get<ArgumentDto[]>(
    `/debates/${debateId}/arguments`,
    { silent: true },
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

export async function deleteArgument(argumentId: string): Promise<void> {
  await httpClient.delete(`/arguments/${argumentId}`);
}
