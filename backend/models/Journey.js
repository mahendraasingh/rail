const mongoose = require('mongoose');

const journeySchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed,
    },
    pnr: {
      type: String,
      required: [true, 'PNR is required'],
      trim: true,
      uppercase: true,
    },
    trainNumber: {
      type: String,
      required: [true, 'Train number is required'],
      trim: true,
    },
    trainName: {
      type: String,
      required: [true, 'Train name is required'],
      trim: true,
    },
    source: {
      type: String,
      required: [true, 'Source station is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination station is required'],
      trim: true,
    },
    journeyDate: {
      type: String,
      required: [true, 'Journey date is required'],
    },
    coach: {
      type: String,
      required: [true, 'Coach is required (e.g. B2, S4)'],
      trim: true,
      uppercase: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
    _id: false, // Allows custom _id when specified, or auto ObjectId if not
  }
);

// Middleware to assign ObjectId if _id is not provided
journeySchema.pre('save', function (next) {
  if (!this._id) {
    this._id = new mongoose.Types.ObjectId();
  }
  next();
});

module.exports = mongoose.model('Journey', journeySchema);

