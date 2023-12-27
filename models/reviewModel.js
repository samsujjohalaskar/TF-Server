const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userEmail: {
    type: String,
  },
  fullName: {
    type: String,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  rating: {
    type: Number,
    default: 3,
  },
  comment: {
    type: String,
  },
  liked: {
    type: String,
  },
  disLiked: {
    type: String,
  },
  canBeImproved: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Review", reviewSchema);
