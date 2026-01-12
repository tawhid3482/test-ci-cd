import cookieParser from "cookie-parser";
import express, { Request, Response } from "express";
import { Application } from "express";
import cors from "cors";
// import { router } from "./routes";
// import { globalErrorHandler } from "./middlewares/globalErrorHandler";
// import notFound from "./middlewares/notFound";
import path from "path";
import apiRouter from "./app/routes/index";

const app: Application = express();
app.use(express.json());

app.use(
  cors({
    origin: [
      // "http://localhost:3000",
      //  "http://localhost:3001",
    //   "https://geniustutorss.com",
    ],
    credentials: true,
  })
);

app.use(cookieParser());

// app.use("/api", router);

app.use("/images", express.static(path.join(__dirname, "../public/images")));
// API Routes
app.use("/api/v1", apiRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("tawhidul islam code-base  start!");
});

// app.use(globalErrorHandler);

// app.use(notFound);

export default app;
