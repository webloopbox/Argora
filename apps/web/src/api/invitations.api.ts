import type { InvitationDto } from "@argora/core";
import { httpClient } from "./http-client";

export async function listMyInvitations(): Promise<InvitationDto[]> {
  const { data } = await httpClient.get<InvitationDto[]>("/invitations");
  return data;
}

export async function acceptInvitation(id: string): Promise<InvitationDto> {
  const { data } = await httpClient.post<InvitationDto>(
    `/invitations/${id}/accept`,
  );
  return data;
}

export async function declineInvitation(id: string): Promise<InvitationDto> {
  const { data } = await httpClient.post<InvitationDto>(
    `/invitations/${id}/decline`,
  );
  return data;
}
