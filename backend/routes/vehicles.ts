import express from 'express';
import { 
  getVehicles, 
  getCategories, 
  createVehicle, 
  updateVehicle, 
  deleteVehicle,
  getOwnerVehicles
} from '../controllers/vehicleController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getVehicles);
router.get('/categories', getCategories);
router.post('/', authenticate, createVehicle);
router.put('/:id', authenticate, updateVehicle);
router.delete('/:id', authenticate, deleteVehicle);

export default router;
