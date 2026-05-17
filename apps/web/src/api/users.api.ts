import type { UserSearchResultDto } from "@brainstorm/core";
import { httpClient } from "./http-client";

export async function searchUsers(
  query: string,
): Promise<UserSearchResultDto[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const { data } = await httpClient.get<UserSearchResultDto[]>(
    "/users/search",
    {
      params: { q: trimmed },
    },
  );
  return data;
}
