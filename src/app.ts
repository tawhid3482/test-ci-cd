import cookieParser from "cookie-parser";
import express, { Request, Response } from "express";
import { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import apiRouter from "./app/routes/index";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { apiRateLimiter } from "./app/middlewares/rateLimiter";

const app: Application = express();

app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(apiRateLimiter);

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "https://tr-tuition.vercel.app","https://e-commerce-frontend-seven-eosin.vercel.app"],
    credentials: true,
  }),
);

app.use(cookieParser());

app.use("/api/v1", apiRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Code-base running!");
});

app.use(globalErrorHandler);

app.use(notFound);

export default app;
