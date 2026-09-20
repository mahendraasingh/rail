const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed,
    },
    name: {
      type: String,
      required: [true, 'Passenger name is required'],
      trim: true,
    },
    journeyId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Journey ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    groupId: {
      type: String,
      trim: true,
      default: null, // null if travelling solo, or a group identifier if travelling together
    },
    coach: {
      type: String,
      required: [true, 'Coach is required'],
      trim: true,
      uppercase: true,
    },
    seatNumber: {
      type: Number,
      required: [true, 'Seat number is required'],
    },
    berthType: {
      type: String,
      enum: ['LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 'SIDE_UPPER', 'WINDOW', 'AISLE', 'CHAIR', 'EXECUTIVE'],
      default: 'LOWER',
    },
    ageCategory: {
      type: String,
      enum: ['ADULT', 'SENIOR', 'CHILD', 'INFANT'],
      default: 'ADULT',
    },
    bookingStatus: {
      type: String,
      enum: ['CNF', 'RAC', 'WL'],
      default: 'CNF',
    },
    isAvailableForSwap: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

passengerSchema.pre('save', function (next) {
  if (!this._id) {
    this._id = new mongoose.Types.ObjectId();
  }
  next();
});

module.exports = mongoose.model('Passenger', passengerSchema);

