import type {
  ArgumentSideCheckResultDto,
  CheckArgumentSideDto,
  CheckDuplicateDto,
  DuplicateCheckResultDto,
  GenerateArgumentDto,
  GeneratedArgumentDto,
  LlmProviderDto,
  SynthesizeDto,
  SynthesisResultDto,
} from "@brainstorm/core";
import { httpClient } from "./http-client";

// The registry is built once at API boot from the configured credentials, so
// the list cannot change inside a browser session. The in-flight promise is
// cached (not just the result) because several panels ask for it at the same
// moment - the drawer renders a desktop and a mobile copy of the form - and
// would otherwise each fire their own request. A failed call drops the cache
// so the next open retries.
let providersPromise: Promise<LlmProviderDto[]> | null = null;

export function listProviders(): Promise<LlmProviderDto[]> {
  providersPromise ??= httpClient
    .get<LlmProviderDto[]>("/ai/providers")
    .then((response) => response.data)
    .catch((err: unknown) => {
      providersPromise = null;
      throw err;
    });
  return providersPromise;
}

export async function generateArgument(
  payload: GenerateArgumentDto,
): Promise<GeneratedArgumentDto> {
  const { data } = await httpClient.post<GeneratedArgumentDto>(
    "/ai/arguments/generate",
    payload,
  );
  return data;
}

export async function checkArgumentSide(
  payload: CheckArgumentSideDto,
): Promise<ArgumentSideCheckResultDto> {
  const { data } = await httpClient.post<ArgumentSideCheckResultDto>(
    "/ai/arguments/check-side",
    payload,
  );
  return data;
}

export async function checkDuplicate(
  payload: CheckDuplicateDto,
): Promise<DuplicateCheckResultDto> {
  const { data } = await httpClient.post<DuplicateCheckResultDto>(
    "/ai/arguments/check-duplicate",
    payload,
  );
  return data;
}

export async function synthesize(
  payload: SynthesizeDto,
): Promise<SynthesisResultDto> {
  const { data } = await httpClient.post<SynthesisResultDto>(
    "/ai/synthesize",
    payload,
  );
  return data;
}
