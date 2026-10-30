const express = require('express');
const Route = require('../models/Route');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' && req.query.all === 'true' ? {} : { userId: req.user._id };
    res.json({ routes: await Route.find(filter).sort({ createdAt: -1 }) });
  } catch (error) { next(error); }
});
router.post('/', async (req, res, next) => {
  try {
    const data = { ...req.body, userId: req.user._id };
    delete data._id;
    const route = await Route.create(data);
    res.status(201).json({ route });
  } catch (error) { next(error); }
});
router.get('/:id', async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found.' });
    if (route.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ message: 'Not allowed to view this route.' });
    res.json({ route });
  } catch (error) { next(error); }
});
router.put('/:id', async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found.' });
    if (route.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ message: 'Not allowed to update this route.' });
    const data = { ...req.body };
    ['_id', 'id', 'userId', 'createdAt'].forEach(key => delete data[key]);
    Object.assign(route, data);
    await route.save();
    res.json({ route });
  } catch (error) { next(error); }
});
router.delete('/:id', async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found.' });
    if (route.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ message: 'Not allowed to delete this route.' });
    await route.deleteOne();
    res.json({ message: 'Route deleted.' });
  } catch (error) { next(error); }
});
module.exports = router;
