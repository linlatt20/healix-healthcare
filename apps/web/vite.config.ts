import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // 루트 .env의 PORT(API 서버 포트)를 읽어서 프록시 대상으로 사용
  const env = loadEnv(mode, path.resolve(__dirname, "../.."), "");
  const apiTarget = `http://localhost:${env.PORT || 3001}`;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@assets": path.resolve(__dirname, "assets"),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        // /api/* → Express 서버. xfwd로 원래 호스트(localhost:5173)를 넘겨서
        // Google 로그인 콜백 URL이 http://localhost:5173/api/callback 이 되게 함
        "/api": { target: apiTarget, xfwd: true },
      },
    },
  };
});
