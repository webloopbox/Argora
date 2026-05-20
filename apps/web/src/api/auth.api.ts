import type {
  AuthTokenDto,
  LoginDto,
  RegisterDto,
  UserDto,
} from "@brainstorm/core";
import { httpClient } from "./http-client";

// All auth calls are `silent` — the login/register forms render inline
// validation errors, and bootstrap (`fetchCurrentUser`) should fail quietly
// for anonymous visitors and stale tokens.
export async function loginRequest(payload: LoginDto): Promise<AuthTokenDto> {
  const { data } = await httpClient.post<AuthTokenDto>("/auth/login", payload, {
    silent: true,
  });
  return data;
}

export async function registerRequest(
  payload: RegisterDto,
): Promise<AuthTokenDto> {
  const { data } = await httpClient.post<AuthTokenDto>(
    "/auth/register",
    payload,
    { silent: true },
  );
  return data;
}

export async function fetchCurrentUser(): Promise<UserDto> {
  const { data } = await httpClient.get<UserDto>("/users/me", { silent: true });
  return data;
}
