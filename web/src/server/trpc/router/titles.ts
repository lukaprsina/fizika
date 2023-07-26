import { z } from "zod";
import { procedure, router, protectedProcedure } from "../utils";

export default router({
  hello: procedure.input(z.object({ name: z.string() })).query(({ input }) => {
    return `Hello ${input.name}`;
  }),
  random: procedure
    .input(z.object({ num: z.number() }))
    .mutation(({ input }) => {
      return Math.floor(Math.random() * 100) / input.num;
    }),
  secret: protectedProcedure.query(({ ctx }) => {
    return `This is top secret - ${ctx.session.user.name}`;
  }),
  getFiles: protectedProcedure.input(z.object({ topic: z.string(), page: z.number() })).query(async ({ input }) => {
    if (!prisma) return;

    const topic = await prisma.topic.findUnique({
      where: {
        title: input.topic
      }
    });

    // change rust to use id for shiz

  })
});
