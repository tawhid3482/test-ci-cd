import httpStatus from "http-status";
import { PrismaClient } from "@prisma/client";
import { contactMailTemplate } from "../../utils/sendContactMail";
import sendEmail from "../../utils/sendEmail";
import { envVars } from "../../config/env";

const prisma = new PrismaClient();

const createContact = async (payload: any) => {
  const contact = await prisma.contact.create({
    data: {
      ...payload,
      priority: payload.priority ?? "Normal",
    },
  });
  const { subject, html } = contactMailTemplate({
    title: contact.title,
    message: contact.message,
    email: contact.email,
    priority: contact.priority,
    createdAt: contact.createdAt,
  });

  await sendEmail(envVars.EMAIL_SENDER_SMTP_USER, subject, html);

  return contact;
};

const getContact = async () => {
  const result = await prisma.contact.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  return result;
};

export const contactService = {
  createContact,
  getContact,
};
