import httpStatus from "http-status";
import { PrismaClient } from "@prisma/client";
import { contactMailTemplate } from "../../utils/sendContactMail";
import sendEmail from "../../utils/sendEmail";
import { envVars } from "../../config/env";
import AppError from "../../helpers/AppError";

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

const updateContact = async (
  contactId: string,
  payload: {
    title?: string;
    message?: string;
    priority?: "Urgent" | "Normal";
    status?: "Pending" | "Resolved" | "Closed";
  },
) => {
  const existingContact = await prisma.contact.findUnique({
    where: {
      id: contactId,
    },
  });

  if (!existingContact) {
    throw new AppError(httpStatus.NOT_FOUND, "Contact message not found");
  }

  return prisma.contact.update({
    where: {
      id: contactId,
    },
    data: payload,
  });
};

export const contactService = {
  createContact,
  getContact,
  updateContact,
};
