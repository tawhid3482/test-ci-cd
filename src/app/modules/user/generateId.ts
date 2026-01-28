import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const generateTutorId = async (gender: string) => {
  const prefix = gender === "Male" ? "TM" : "TF";

  const tutors = await prisma.tutor.findMany({
    where: { tutor_id: { startsWith: prefix } },
    select: { tutor_id: true },
    orderBy: { tutor_id: 'desc' }, // get max first
    take: 1,
  });

  let maxNumber = 0;
  if (tutors.length) {
    maxNumber = parseInt(tutors[0].tutor_id!.slice(2)) || 0;
  }

  const nextNumber = maxNumber + 1;
  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
};


export const generateStudentId = async () => {
  const students = await prisma.student.findMany({
    where: { student_id: { startsWith: "S" } },
    select: { student_id: true },
  });

  let maxNumber = 0;
  for (const s of students) {
    const num = parseInt(s.student_id!.slice(1)); // "S100" → 100
    if (num > maxNumber) maxNumber = num;
  }

  const nextNumber = maxNumber + 1;
  return `S${String(nextNumber).padStart(3, "0")}`;
};
