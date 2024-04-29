const mongoose = require("mongoose");

const bookedSlotSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  bookingDate: {
    type: String,
    required: true,
  },
  slots: [
    {
      time: {
        type: String,
        required: true,
      },
      bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    },
  ],
});

module.exports = mongoose.model("BookedSlot", bookedSlotSchema);
