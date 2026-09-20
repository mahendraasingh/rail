const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema(
  {
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journey',
      required: true,
    },
    requesterPassengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Passenger',
      required: true,
    },
    targetPassengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Passenger',
      required: true,
    },
    requesterSeat: {
      coach: { type: String, required: true },
      seatNumber: { type: Number, required: true },
      berthType: { type: String, required: true },
    },
    targetSeat: {
      coach: { type: String, required: true },
      seatNumber: { type: Number, required: true },
      berthType: { type: String, required: true },
    },
    reason: {
      type: String,
      default: 'Travelling with group members and looking to sit closer together.',
    },
    matchScore: {
      type: Number,
      default: 80,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
