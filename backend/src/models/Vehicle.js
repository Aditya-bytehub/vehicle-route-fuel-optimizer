const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  reg: { type: String, trim: true, default: '' },
  fuelType: { type: String, enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'Other'], default: 'Petrol' },
  mileage: { type: Number, min: 0, default: 0 },
  fuelPrice: { type: Number, min: 0, default: 0 },
  capacity: { type: Number, min: 0, default: 0 },
  speed: { type: Number, min: 0, default: 40 }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
