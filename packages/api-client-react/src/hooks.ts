/**
 * React Query 훅 — 기존 Orval 생성 코드와 같은 이름·호출 방식으로 다시 작성.
 *   query:    useGetClinics(params?, { query?: {...} })
 *   mutation: useCreateComment().mutate({ postId, data })
 * 쿼리 키는 "/api/..." 경로를 그대로 써서 invalidateQueries({ queryKey: ["/api/health-record"] })가 동작합니다.
 */
import {
  useMutation,
  useQuery,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type * as S from "./generated/api.schemas";

type QueryOpts<T> = { query?: Partial<UseQueryOptions<T, Error, T, QueryKey>> };
type MutationOpts<TData, TVars> = {
  mutation?: Omit<UseMutationOptions<TData, Error, TVars>, "mutationFn">;
};

const withParams = (path: string, params?: object): QueryKey =>
  params && Object.values(params).some((v) => v !== undefined) ? [path, params] : [path];

/* ───────────── Health ───────────── */
export const getHealthCheckQueryKey = () => ["/api/healthz"] as const;
export function useHealthCheck(options?: QueryOpts<{ status: string }>) {
  return useQuery({
    queryKey: getHealthCheckQueryKey(),
    queryFn: ({ signal }) => customFetch<{ status: string }>("/api/healthz", { signal }),
    ...options?.query,
  });
}

/* ───────────── Clinics ───────────── */
export const getGetClinicsQueryKey = (params?: S.GetClinicsParams) => withParams("/api/clinics", params);
export function useGetClinics(params?: S.GetClinicsParams, options?: QueryOpts<S.Clinic[]>) {
  return useQuery({
    queryKey: getGetClinicsQueryKey(params),
    queryFn: ({ signal }) =>
      customFetch<S.Clinic[]>("/api/clinics", { params: params as Record<string, string>, signal }),
    ...options?.query,
  });
}

export function useRecommendClinic(
  options?: MutationOpts<S.ClinicRecommendResponse, { data: S.ClinicRecommendRequest }>,
) {
  return useMutation({
    mutationFn: ({ data }) =>
      customFetch<S.ClinicRecommendResponse>("/api/clinics/recommend", { method: "POST", data }),
    ...options?.mutation,
  });
}

/* ───────────── Translation / Chatbot ───────────── */
export function useTranslateMedical(
  options?: MutationOpts<S.TranslationResponse, { data: S.TranslationRequest }>,
) {
  return useMutation({
    mutationFn: ({ data }) =>
      customFetch<S.TranslationResponse>("/api/translate", { method: "POST", data }),
    ...options?.mutation,
  });
}

export function useChatbotMessage(
  options?: MutationOpts<S.ChatbotResponse, { data: S.ChatbotRequest }>,
) {
  return useMutation({
    mutationFn: ({ data }) => customFetch<S.ChatbotResponse>("/api/chatbot", { method: "POST", data }),
    ...options?.mutation,
  });
}

/* ───────────── Insurance ───────────── */
export const getGetInsuranceGuideQueryKey = () => ["/api/insurance/guide"] as const;
export function useGetInsuranceGuide(options?: QueryOpts<S.InsuranceGuide>) {
  return useQuery({
    queryKey: getGetInsuranceGuideQueryKey(),
    queryFn: ({ signal }) => customFetch<S.InsuranceGuide>("/api/insurance/guide", { signal }),
    ...options?.query,
  });
}

export function useCalculateInsurance(
  options?: MutationOpts<S.InsuranceCalculationResponse, { data: S.InsuranceCalculationRequest }>,
) {
  return useMutation({
    mutationFn: ({ data }) =>
      customFetch<S.InsuranceCalculationResponse>("/api/insurance/calculate", { method: "POST", data }),
    ...options?.mutation,
  });
}

/* ───────────── Community ───────────── */
export const getGetCommunityPostsQueryKey = (params?: S.GetCommunityPostsParams) =>
  withParams("/api/community/posts", params);
export function useGetCommunityPosts(params?: S.GetCommunityPostsParams, options?: QueryOpts<S.PostsPage>) {
  return useQuery({
    queryKey: getGetCommunityPostsQueryKey(params),
    queryFn: ({ signal }) =>
      customFetch<S.PostsPage>("/api/community/posts", {
        params: params as Record<string, string | number>,
        signal,
      }),
    ...options?.query,
  });
}

export const getGetCommunityPostQueryKey = (postId: number) => [`/api/community/posts/${postId}`] as const;
export function useGetCommunityPost(postId: number, options?: QueryOpts<S.PostDetail>) {
  return useQuery({
    queryKey: getGetCommunityPostQueryKey(postId),
    queryFn: ({ signal }) => customFetch<S.PostDetail>(`/api/community/posts/${postId}`, { signal }),
    enabled: !!postId,
    ...options?.query,
  });
}

export function useCreateCommunityPost(options?: MutationOpts<S.Post, { data: S.CreatePostRequest }>) {
  return useMutation({
    mutationFn: ({ data }) => customFetch<S.Post>("/api/community/posts", { method: "POST", data }),
    ...options?.mutation,
  });
}

export function useCreateComment(
  options?: MutationOpts<S.Comment, { postId: number; data: S.CreateCommentRequest }>,
) {
  return useMutation({
    mutationFn: ({ postId, data }) =>
      customFetch<S.Comment>(`/api/community/posts/${postId}/comments`, { method: "POST", data }),
    ...options?.mutation,
  });
}

/* ───────────── Health record ───────────── */
export const getGetHealthRecordQueryKey = () => ["/api/health-record"] as const;
export function useGetHealthRecord(options?: QueryOpts<S.HealthRecord>) {
  return useQuery({
    queryKey: getGetHealthRecordQueryKey(),
    queryFn: ({ signal }) => customFetch<S.HealthRecord>("/api/health-record", { signal }),
    retry: false, // 로그인 안 했으면 401 → 재시도 불필요
    ...options?.query,
  });
}

export function useUpdateHealthRecord(
  options?: MutationOpts<S.HealthRecord, { data: S.UpdateHealthRecordRequest }>,
) {
  return useMutation({
    mutationFn: ({ data }) => customFetch<S.HealthRecord>("/api/health-record", { method: "PUT", data }),
    ...options?.mutation,
  });
}

export const getGetVisitsQueryKey = () => ["/api/health-record/visits"] as const;
export function useGetVisits(options?: QueryOpts<S.Visit[]>) {
  return useQuery({
    queryKey: getGetVisitsQueryKey(),
    queryFn: ({ signal }) => customFetch<S.Visit[]>("/api/health-record/visits", { signal }),
    retry: false,
    ...options?.query,
  });
}

export function useAddVisit(options?: MutationOpts<S.Visit, { data: S.AddVisitRequest }>) {
  return useMutation({
    mutationFn: ({ data }) =>
      customFetch<S.Visit>("/api/health-record/visits", { method: "POST", data }),
    ...options?.mutation,
  });
}
