const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed,
    },
    journeyId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    requesterPassengerId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    targetPassengerId: {
      type: mongoose.Schema.Types.Mixed,
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
    _id: false,
  }
);

swapRequestSchema.pre('save', function (next) {
  if (!this._id) {
    this._id = new mongoose.Types.ObjectId();
  }
  next();
});

module.exports = mongoose.model('SwapRequest', swapRequestSchema);

