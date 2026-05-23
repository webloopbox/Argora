import type { SeedUser } from './users';

const API_URL = 'http://localhost:3000';

async function apiFetch(
  path: string,
  token: string,
  method: string,
  body?: unknown,
): Promise<unknown> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function createDebateApi(
  token: string,
  payload: { thesis: string; visibility: 'public' | 'private'; groupId?: string },
) {
  return apiFetch('/debates', token, 'POST', {
    thesis: payload.thesis,
    visibility: payload.visibility,
    ...(payload.groupId ? { groupId: payload.groupId } : {}),
  }) as Promise<{ id: string; thesis: string }>;
}

export async function createArgumentApi(
  token: string,
  debateId: string,
  payload: { content: string; side: 'pro' | 'against'; parentId?: string },
) {
  return apiFetch(
    `/debates/${debateId}/arguments`,
    token,
    'POST',
    payload,
  ) as Promise<{ id: string; content: string }>;
}

export async function createGroupApi(
  token: string,
  payload: { name: string },
) {
  return apiFetch('/groups', token, 'POST', payload) as Promise<{
    id: string;
    name: string;
  }>;
}

export async function inviteToGroupApi(
  token: string,
  groupId: string,
  inviteeId: string,
) {
  return apiFetch(
    `/groups/${groupId}/invitations`,
    token,
    'POST',
    { inviteeId },
  ) as Promise<{ id: string }>;
}

export async function getCurrentUser(token: string): Promise<SeedUser['user']> {
  return apiFetch('/users/me', token, 'GET') as Promise<SeedUser['user']>;
}
