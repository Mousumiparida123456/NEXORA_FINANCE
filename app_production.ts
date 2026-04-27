import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

const app: Express = express();

app.get("/", (_req: Request, res: Response) => {
  res.send("🚀 NEXORA API IS LIVE - LOGIN REDIRECTS ENABLED");
});

app.set("trust proxy", 1);

app.use(
  (pinoHttp as any)({
    logger,
    serializers: {
      req(req: any) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res: any) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(
  (helmet as any)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// Explicit CORS for production
const allowedOrigins = [
  "https://nexora-finance-fintech-dashboard.vercel.app",
  "http://localhost:5173"
];

app.use(cors({ 
  credentials: true, 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const globalLimiter = (rateLimit as any)({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.use("/api", globalLimiter);
app.use(authMiddleware);

app.use("/api", router);
app.use("/api/v1", router);

export default app;
