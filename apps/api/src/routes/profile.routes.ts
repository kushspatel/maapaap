import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', ProfileController.getProfiles);
router.post('/', ProfileController.createProfile);
router.get('/:id', ProfileController.getProfile);
router.put('/:id', ProfileController.updateProfile);
router.delete('/:id', ProfileController.deleteProfile);
router.get('/:id/measurement-sets', ProfileController.getProfileMeasurementSets);

export default router;
