const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  //basic info

  name: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  area: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },

  //Restaurant details

  startTime: {
    type: String,
  },
  endTime: {
    type: String,
  },
  cuisine: [
    {
      type: String,
    },
  ],
  types: [
    {
      type: String,
    },
  ],
  offers: [
    {
      type: String,
    },
  ],

  //Additional Details

  website: {
    type: String,
  },
  averageCostForTwo: {
    type: Number,
    default: 1000,
  },
  extraDiscount: [
    {
      type: String,
    },
  ],
  amenities: [
    {
      type: String,
    },
  ],

  //Images and Menu

  images: [
    {
      data: Buffer,
      contentType: String,
    },
  ],
  menu: [
    {
      data: Buffer,
      contentType: String,
    },
  ],

  //Foreign Keys

  owner: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantOwner",
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
  },
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  bookings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
  ],
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
