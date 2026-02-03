import { Router } from "express";
import { districtController } from "./district.controller";
import { auth } from "../../middlewares/authMiddleware";

const router = Router();

router.post("/create", districtController.createDistrict);
router.get("/", districtController.getAllDistricts);

export const districtRoute = router;
