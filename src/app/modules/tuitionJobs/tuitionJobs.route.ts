import { Router } from "express";
import { auth } from "../../middlewares/authMiddleware";
import { tuitionJobsController } from "./tuitionJobs.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createTuitionJobSchema } from "./tuitionJobs.validation";

const router = Router();

router.post("/create", auth(),validateRequest(createTuitionJobSchema), tuitionJobsController.createTuitionJobs);

router.get("/",tuitionJobsController.getAllTuitionJobs);

export const tuitionJobsRoutes = router;
