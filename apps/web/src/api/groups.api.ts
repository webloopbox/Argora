import type {
  CreateGroupDto,
  GroupDetailDto,
  GroupSummaryDto,
  InvitationDto,
  CreateInvitationDto,
} from "@brainstorm/core";
import { httpClient } from "./http-client";

export async function listMyGroups(): Promise<GroupSummaryDto[]> {
  const { data } = await httpClient.get<GroupSummaryDto[]>("/groups");
  return data;
}

export async function fetchGroupDetail(id: string): Promise<GroupDetailDto> {
  const { data } = await httpClient.get<GroupDetailDto>(`/groups/${id}`);
  return data;
}

export async function createGroup(
  payload: CreateGroupDto,
): Promise<GroupDetailDto> {
  const { data } = await httpClient.post<GroupDetailDto>("/groups", payload);
  return data;
}

export async function archiveGroup(id: string): Promise<void> {
  await httpClient.delete(`/groups/${id}`);
}

export async function inviteToGroup(
  groupId: string,
  payload: CreateInvitationDto,
): Promise<InvitationDto> {
  const { data } = await httpClient.post<InvitationDto>(
    `/groups/${groupId}/invitations`,
    payload,
  );
  return data;
}

export async function listGroupInvitations(
  groupId: string,
): Promise<InvitationDto[]> {
  const { data } = await httpClient.get<InvitationDto[]>(
    `/groups/${groupId}/invitations`,
  );
  return data;
}
