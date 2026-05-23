import type { StatsDto } from "@brainstorm/core";
import { httpClient } from "./http-client";

// Background polling - toast would be noise on a transient hiccup.
export async function fetchStats(): Promise<StatsDto> {
  const { data } = await httpClient.get<StatsDto>("/stats", { silent: true });
  return data;
}
