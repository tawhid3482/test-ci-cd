import cookieParser from "cookie-parser";
import express, { Request, Response } from "express";
import { Application } from "express";
import cors from "cors";
// import { router } from "./routes";
import path from "path";
import apiRouter from "./app/routes/index";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";

const app: Application = express();
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
       "http://localhost:3001",
    ],
    credentials: true,
  })
);

app.use(cookieParser());

// app.use("/api", router);

// app.use("/images", express.static(path.join(__dirname, "../public/images")));
// API Routes
app.use("/api/v1", apiRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Code-base running!");
});

app.use(globalErrorHandler);

app.use(notFound);

export default app;
