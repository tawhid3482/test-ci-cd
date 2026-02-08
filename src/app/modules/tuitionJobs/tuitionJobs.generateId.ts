import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const generateJobId = async () => {
  const prefix ="TJ";

  const jobs = await prisma.tuitionJobs.findMany({
    where: { jobs_id: { startsWith: prefix } },
    select: { jobs_id: true },
    orderBy: { jobs_id: 'desc' }, 
    take: 1,
  });

  let maxNumber = 0;
  if (jobs.length) {
    maxNumber = parseInt(jobs[0].jobs_id!.slice(2)) || 0;
  }

  const nextNumber = maxNumber + 1;
  return `${prefix}${String(nextNumber).padStart(2, "0")}`;
};