import type { ArgumentDto, VoteValue } from "@brainstorm/core";
import { httpClient } from "./http-client";

export async function castVote(
  argumentId: string,
  value: VoteValue,
): Promise<ArgumentDto> {
  const { data } = await httpClient.post<ArgumentDto>(
    `/arguments/${argumentId}/votes`,
    { value },
  );
  return data;
}

export async function retractVote(
  argumentId: string,
): Promise<ArgumentDto> {
  const { data } = await httpClient.delete<ArgumentDto>(
    `/arguments/${argumentId}/votes`,
  );
  return data;
}
