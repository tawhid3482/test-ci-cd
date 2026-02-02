import { Router } from "express";
import { contactController } from "./contact.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createContactSchema } from "./contact.validation";

const router = Router();

router.post(
  "/create-contact",
  validateRequest(createContactSchema),
  contactController.createContact,
);
router.get("/",  contactController.getContact);

export const contactRoute = router;
