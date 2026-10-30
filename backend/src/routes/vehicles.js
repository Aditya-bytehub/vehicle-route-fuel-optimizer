const express = require('express');
const Vehicle = require('../models/Vehicle');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);
router.get('/', async (req, res, next) => {
  try { const filter = req.user.role === 'admin' && req.query.all === 'true' ? {} : { userId: req.user._id }; res.json({ vehicles: await Vehicle.find(filter).sort({ createdAt: -1 }) }); }
  catch (error) { next(error); }
});
router.post('/', async (req, res, next) => {
  try { const vehicle = await Vehicle.create({ ...req.body, userId: req.user._id }); res.status(201).json({ vehicle }); }
  catch (error) { next(error); }
});
router.put('/:id', async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });
    if (vehicle.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ message: 'Not allowed to update this vehicle.' });
    const data = { ...req.body }; ['_id', 'id', 'userId', 'createdAt'].forEach(key => delete data[key]);
    Object.assign(vehicle, data); await vehicle.save(); res.json({ vehicle });
  } catch (error) { next(error); }
});
router.delete('/:id', async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });
    if (vehicle.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ message: 'Not allowed to delete this vehicle.' });
    await vehicle.deleteOne(); res.json({ message: 'Vehicle deleted.' });
  } catch (error) { next(error); }
});
module.exports = router;
