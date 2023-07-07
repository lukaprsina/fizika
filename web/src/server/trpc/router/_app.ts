import { router } from "../utils";
import titles from "./titles";

export const appRouter = router({
  titles,
});

export type IAppRouter = typeof appRouter;
