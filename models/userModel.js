const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  fullName: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  image: {
    data: Buffer,
    contentType: String,
  },
  bookings: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    },
  ],
  reviews: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },
    },
  ],
  blogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
    },
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Like",
    },
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  creationTime: {
    type: String,
  },
  lastSignInTime: {
    type: String,
  },
});

module.exports = mongoose.model("User", userSchema);
