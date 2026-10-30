const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  routeName: { type: String, required: true, trim: true, maxlength: 120 },
  vehicleId: { type: String, default: '' },
  depot: { type: mongoose.Schema.Types.Mixed, default: {} },
  startTime: { type: String, default: '09:00' },
  startDate: { type: String, default: '' },
  stops: { type: [mongoose.Schema.Types.Mixed], default: [] },
  originalOrder: { type: [String], default: [] },
  optimizedOrder: { type: [String], default: [] },
  originalDistance: { type: Number, default: 0 },
  optimizedDistance: { type: Number, default: 0 },
  fuelUsed: { type: Number, default: 0 },
  fuelCost: { type: Number, default: 0 },
  urgentCount: { type: Number, default: 0 },
  lateCount: { type: Number, default: 0 },
  onTimeRate: { type: Number, default: 100 },
  algorithm: { type: String, default: 'Haversine + Priority-Aware NN + 2-Opt' }
}, { timestamps: true, strict: false });

module.exports = mongoose.model('Route', routeSchema);
