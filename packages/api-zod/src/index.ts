/**
 * Healix API 런타임 검증 스키마.
 * Replit에서는 OpenAPI 스펙으로 자동 생성되던 패키지인데, 내보낸 코드에 빠져 있어서
 * 서버(apps/api)가 실제로 쓰는 스키마만 직접 다시 작성했습니다.
 */
import { z } from "zod";

export const HealthCheckResponse = z.object({
  status: z.string(),
});

export const AuthUser = z.object({
  id: z.string(),
  email: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  profileImageUrl: z.string().nullable().optional(),
  profileSetupComplete: z.number().int().optional(),
});
export type AuthUser = z.infer<typeof AuthUser>;

export const GetCurrentAuthUserResponse = z.object({
  user: AuthUser.nullable(),
});
export type GetCurrentAuthUserResponse = z.infer<typeof GetCurrentAuthUserResponse>;

export const ExchangeMobileAuthorizationCodeBody = z.object({
  code: z.string().min(1),
  code_verifier: z.string().min(1),
  redirect_uri: z.string().url(),
  state: z.string().min(1),
  nonce: z.string().nullable().optional(),
});
export type ExchangeMobileAuthorizationCodeBody = z.infer<
  typeof ExchangeMobileAuthorizationCodeBody
>;

export const ExchangeMobileAuthorizationCodeResponse = z.object({
  token: z.string(),
});

export const LogoutMobileSessionResponse = z.object({
  success: z.boolean(),
});
