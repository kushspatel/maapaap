import { Router } from 'express';
import { MeasurementSetController } from '../controllers/measurement-set.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/:id', MeasurementSetController.getMeasurementSet);
router.post('/', MeasurementSetController.createMeasurementSet);
router.put('/:id', MeasurementSetController.updateMeasurementSet);
router.delete('/:id', MeasurementSetController.deleteMeasurementSet);

export default router;
