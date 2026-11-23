# Healix — Care Without Borders

외국인 환자를 위한 다국어 헬스케어 앱 (ASVF 2026, Team 1).
Replit에서 내보낸 코드를 **VS Code + 로컬 개발 환경**에서 돌아가도록 다시 구성한 버전입니다.

## 구조

```
healix/
├─ apps/
│  ├─ api/        Express + OpenAI + Google 로그인 (포트 3001)
│  ├─ web/        React + Vite + Tailwind v4 (포트 5173, /api → 3001 프록시)
│  └─ mobile/     Expo (SDK 54) + expo-router
├─ packages/
│  ├─ db/                   Drizzle ORM 스키마 + 시드 (PostgreSQL)
│  ├─ api-zod/              서버용 zod 스키마        ← 원본에 없어서 새로 작성
│  ├─ api-client-react/     React Query 훅 + 타입    ← 원본에 없어서 새로 작성
│  └─ replit-auth-web/      웹 로그인 훅(useAuth)     ← 원본에 없어서 새로 작성
├─ .vscode/      추천 확장, 태스크, 디버그 설정
├─ api.http       REST Client로 API 테스트
└─ .env.example
```

## 처음 한 번 설정

1. **필요한 것**: Node.js 20.19+ (22 권장), pnpm, PostgreSQL
   ```powershell
   corepack enable          # pnpm 활성화 (또는 npm i -g pnpm)
   # 전역 설치 없이 쓰려면 모든 pnpm 명령 앞에 `npx pnpm@10.15.0` 을 붙여도 됩니다
   ```
   Postgres는 로컬 설치, Docker, 또는 Supabase/Neon 무료 DB 중 편한 걸 쓰세요.
2. **환경변수**: `.env.example`을 `.env`로 복사해서 값 채우기
   (`DATABASE_URL`, `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID/SECRET`)
   모바일은 `apps/mobile/.env.example` → `apps/mobile/.env`
3. **설치**
   ```powershell
   pnpm install
   cd apps/mobile; pnpm fix-deps; cd ../..   # Expo 패키지 버전 자동 정렬
   ```
4. **DB 테이블 만들기**
   ```powershell
   pnpm db:push
   ```
   (서버를 처음 켜면 병원·커뮤니티 시드 데이터가 자동으로 들어갑니다)
5. **Google 로그인**: Google Cloud Console → API 및 서비스 → 사용자 인증 정보 →
   OAuth 클라이언트 ID(웹) → 승인된 리디렉션 URI에 `http://localhost:5173/api/callback` 추가

## 실행

| 무엇 | 명령 | VS Code |
|---|---|---|
| API + 웹 같이 | `pnpm dev` | 태스크 **Dev: API + Web** |
| API만 | `pnpm dev:api` | 디버그 **API: debug (tsx)** (브레이크포인트 가능) |
| 웹만 | `pnpm dev:web` → http://localhost:5173 | 태스크 **Web: dev** |
| 모바일 | `pnpm dev:mobile` → Expo Go로 QR 스캔 | 태스크 **Mobile: Expo start** |
| 타입 검사 | `pnpm typecheck` | 태스크 **Typecheck all** |

VS Code에서 태스크 실행: `Ctrl+Shift+P` → **Tasks: Run Task**.
휴대폰에서 테스트할 때는 `apps/mobile/.env`의 `EXPO_PUBLIC_API_URL`을 PC의 LAN IP(예: `http://192.168.0.10:3001`)로 바꾸세요.

## Replit 버전과 달라진 점

- 빠져 있던 `api-zod`, `api-client-react`, `replit-auth-web`, 모바일 `constants/colors.ts`, 웹 로고 이미지를 새로 만들었습니다.
- `apps/api/src/lib/openai.ts`: `OPENAI_API_KEY`도 쓸 수 있게 (기존 `AI_INTEGRATIONS_*`도 그대로 지원)
- `apps/api/src/app.ts`: CORS를 `WEB_ORIGIN` 허용 목록으로 제한, JSON 본문 제한을 15MB로 (사진 번역용)
- `apps/mobile/app/_layout.tsx`: `EXPO_PUBLIC_API_URL`로 서버 주소 지정
- 타입 오류 수정: 보험 화면에서 `Info` 아이콘 import 누락(계산 결과 표시 시 화면이 깨지던 버그), 가이드 데이터 타입 지정, 예약 목록 변수 타입 지정
- 웹 로고 파일 이름 정리: `image_1774266704055.png` → `healix-logo.png`
- 나머지 화면·라우트 코드는 원본 그대로입니다.

## 알려진 문제 (다음 작업)

- [ ] `OPENAI_API_KEY`가 없으면 서버 전체가 시작되지 않음 → AI 기능만 꺼지도록 변경

- [ ] 통역 예약 수정·취소·확정 API에 로그인/본인 확인이 없음 (IDOR)
- [ ] AI 엔드포인트(`/chatbot`, `/translate`, `/translate/doc`, `/clinics/recommend`) 인증·사용량 제한 없음
- [ ] 챗봇 `conversationHistory` role 검증, 프롬프트 인젝션 대비
- [ ] `PUT /health-record` 입력 필드 화이트리스트(zod) 적용
- [ ] 모바일 로그인 화면 없음 → 건강기록 탭 401
- [ ] 모바일 음성 입력이 가짜(placeholder)
- [ ] 병원 예약 중복 방지, 예약 취소·수정 API
- [ ] 병원·커뮤니티 검색을 DB 쿼리로 (현재 전체 조회 후 JS 필터)
- [ ] 보험 본인부담률을 건강보험공단 기준으로 검증
