import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient()

const res1 = await prisma.topic.updateMany({ data: { active: true } })
const res2 = await prisma.page.updateMany({ data: { active: true } })

console.log(res1, res2)