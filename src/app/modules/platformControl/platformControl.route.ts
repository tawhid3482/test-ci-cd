import { Router } from "express";
import { auth } from "../../middlewares/authMiddleware"; 
import { platformControlController } from "./platformControl.controller";

const router = Router();

router.post("/add-subject", platformControlController.addSubjects);
router.post("/add-medium", platformControlController.addMediums);
router.post("/add-classes", platformControlController.addClasses);``
router.get("/get-subjects", platformControlController.getAllSubjects);
router.get("/get-medium", platformControlController.getAllMediums);
router.get("/get-classes", platformControlController.getAllClasses );

export const platformControlRoute = router;
