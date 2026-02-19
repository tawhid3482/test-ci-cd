import { Router } from "express";
import { Role } from "@prisma/client";
import { contactController } from "./contact.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createContactSchema } from "./contact.validation";
import { auth } from "../../middlewares/authMiddleware";

const router = Router();

router.post(
  "/create-contact",
  validateRequest(createContactSchema),
  contactController.createContact,
);

router.get("/", auth(Role.ADMIN, Role.SUPER_ADMIN), contactController.getContact);

export const contactRoute = router;
