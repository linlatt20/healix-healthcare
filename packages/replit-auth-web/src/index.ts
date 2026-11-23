/**
 * 웹용 로그인 훅. (Replit 템플릿의 @workspace/replit-auth-web를 대체)
 * 서버(apps/api/src/routes/auth.ts)의 세션 쿠키 방식 그대로:
 *   GET /api/auth/user  → { user }
 *   GET /api/login?returnTo=/path → Google 로그인 → /api/callback → 쿠키 발급
 *   GET /api/logout
 * 이름은 기존 import 경로를 안 바꾸려고 그대로 둠.
 */
import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

export interface AuthUser {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  profileSetupComplete?: number;
}

export const AUTH_USER_QUERY_KEY = ["/api/auth/user"] as const;

function apiBase(): string {
  // Vite의 BASE_URL(예: "/")을 접두사로 사용
  const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/";
  return base.replace(/\/$/, "");
}

async function fetchUser(): Promise<AuthUser | null> {
  const res = await fetch(`${apiBase()}/api/auth/user`, { credentials: "include" });
  if (!res.ok) return null;
  const body = (await res.json()) as { user: AuthUser | null };
  return body.user ?? null;
}

export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: AUTH_USER_QUERY_KEY,
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const login = useCallback(() => {
    const returnTo = window.location.pathname + window.location.search;
    window.location.href = `${apiBase()}/api/login?returnTo=${encodeURIComponent(returnTo)}`;
  }, []);

  const logout = useCallback(() => {
    window.location.href = `${apiBase()}/api/logout`;
  }, []);

  const user = data ?? null;
  return { user, isLoading, isAuthenticated: !!user, login, logout };
}
