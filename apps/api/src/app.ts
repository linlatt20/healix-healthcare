import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

const app: Express = express();
app.disable("etag");

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// Render 같은 호스팅은 앞단 프록시를 거치므로 x-forwarded-* 헤더를 신뢰
app.set("trust proxy", 1);

const allowedOrigins = [
  ...(process.env.WEB_ORIGIN ?? "http://localhost:5173").split(","),
  // Render가 자동으로 넣어주는 이 서비스의 공개 주소 (예: https://healix.onrender.com)
  process.env.RENDER_EXTERNAL_URL ?? "",
]
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    credentials: true,
    // 모바일 앱(Origin 헤더 없음)은 허용, 브라우저는 허용 목록만
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  }),
);
app.use(cookieParser());
// 문서 사진 번역·프로필 사진(base64)을 위해 기본 100KB → 15MB
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(authMiddleware);

app.use("/api", router);

// 배포 환경: 빌드된 웹 앱(apps/web/dist)을 같은 서버에서 제공
// → 웹과 API가 같은 주소를 써서 CORS·쿠키·Google 로그인 콜백이 단순해짐
if (process.env.NODE_ENV === "production") {
  const webDist = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../web/dist",
  );
  if (fs.existsSync(webDist)) {
    app.use(express.static(webDist, { index: false }));
    // 클라이언트 라우팅(/clinics, /chatbot 등)은 모두 index.html로
    app.get(/^(?!\/api(\/|$)).*/, (_req, res) => {
      res.sendFile(path.join(webDist, "index.html"));
    });
  } else {
    logger.warn({ webDist }, "Web build not found — serving API only");
  }
}

export default app;
