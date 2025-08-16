import { Router } from 'express';
import auth from './auth.routes.js';
import doctors from './doctors.routes.js';
import appointments from './appointments.routes.js';
import visits from './visits.routes.js';
import admin from "./admin.routes.js";
import patient from "./patient.routes.js";
import visit from "./visits.routes.js"
import finance from "./finance.routes.js";

const router = Router();

router.use('/', auth);
router.use('/doctors', doctors);
router.use('/appointments', appointments);
router.use('/visits', visits);
router.use("/admin", admin);
router.use("/patient", patient);
router.use("/visit", visit);
router.use("/finance", finance);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

router.get('/', (_req, res) => {
  res.json({ message: 'Welcome to the API' });
});

router.use((_req, res) => res.status(404).json({ message: 'Not found' }));

export default router;
