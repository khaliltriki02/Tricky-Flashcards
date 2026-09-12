import { Router, type IRouter } from "express";
import healthRouter from "./health";
import decksRouter from "./decks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(decksRouter);

export default router;
