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

export async function listProviders(): Promise<LlmProviderDto[]> {
  const { data } = await httpClient.get<LlmProviderDto[]>("/ai/providers");
  return data;
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
