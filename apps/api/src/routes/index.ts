import { Router, type IRouter } from "express";
import healthRouter from "./health";
import translationRouter from "./translation";
import chatbotRouter from "./chatbot";
import clinicsRouter from "./clinics";
import insuranceRouter from "./insurance";
import communityRouter from "./community";
import healthRecordRouter from "./healthRecord";
import interpreterRouter from "./interpreter";
import clinicAppointmentsRouter from "./clinicAppointments";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(translationRouter);
router.use(chatbotRouter);
router.use(clinicsRouter);
router.use(insuranceRouter);
router.use(communityRouter);
router.use(healthRecordRouter);
router.use(interpreterRouter);
router.use(clinicAppointmentsRouter);
router.use(authRouter);

export default router;
