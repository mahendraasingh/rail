const mongoose = require('mongoose');

const journeySchema = new mongoose.Schema(
  {
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
  }
);

module.exports = mongoose.model('Journey', journeySchema);
