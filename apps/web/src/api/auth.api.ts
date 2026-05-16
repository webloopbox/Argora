import type {
  AuthTokenDto,
  LoginDto,
  RegisterDto,
  UserDto,
} from "@brainstorm/core";
import { httpClient } from "./http-client";

export async function loginRequest(payload: LoginDto): Promise<AuthTokenDto> {
  const { data } = await httpClient.post<AuthTokenDto>("/auth/login", payload);
  return data;
}

export async function registerRequest(
  payload: RegisterDto,
): Promise<AuthTokenDto> {
  const { data } = await httpClient.post<AuthTokenDto>(
    "/auth/register",
    payload,
  );
  return data;
}

export async function fetchCurrentUser(): Promise<UserDto> {
  const { data } = await httpClient.get<UserDto>("/users/me");
  return data;
}
