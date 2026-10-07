import type { ArgumentDto, VoteValue } from "@argora/core";
import { httpClient } from "./http-client";

// Vote controls render their own inline error (VoteControls.tsx) so the
// global toast would duplicate the signal.
export async function castVote(
  argumentId: string,
  value: VoteValue,
): Promise<ArgumentDto> {
  const { data } = await httpClient.post<ArgumentDto>(
    `/arguments/${argumentId}/votes`,
    { value },
    { silent: true },
  );
  return data;
}

export async function retractVote(
  argumentId: string,
): Promise<ArgumentDto> {
  const { data } = await httpClient.delete<ArgumentDto>(
    `/arguments/${argumentId}/votes`,
    { silent: true },
  );
  return data;
}
