import { Router, type IRouter } from "express";
import healthRouter from "./health";
import identityRouter from "./identity";
import aliasesRouter from "./aliases";
import eventsRouter from "./events";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/identity", identityRouter);
router.use("/alia", aliasesRouter);
router.use("/events", eventsRouter);

export default router;
