import { Router, type IRouter } from "express";
import healthRouter from "./health";
import identityRouter from "./identity";
import aliasesRouter from "./aliases";
import eventsRouter from "./events";
import walletRouter from "./wallet";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/identity", identityRouter);
router.use("/alia", aliasesRouter);
router.use("/events", eventsRouter);
router.use("/wallet", walletRouter);

export default router;
