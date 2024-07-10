const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const restaurantOwnerSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },
  restaurants: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
      name: String,
      city: String,
      location: String,
    },
  ],
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

restaurantOwnerSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

restaurantOwnerSchema.methods.generateAuthToken = async function () {
  try {
    let newToken = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
    this.tokens = this.tokens.concat({ token: newToken });
    await this.save();
    return newToken;
  } catch (error) {
    console.log(error);
  }
};
// restaurantOwnerSchema.methods.generateAuthToken = async function () {
//   try {
//     const newToken = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
//     this.tokens = [{ token: newToken }];
//     await this.save();

//     return newToken;
//   } catch (error) {
//     console.log(error);
//   }
// };

module.exports = mongoose.model("RestaurantOwner", restaurantOwnerSchema);
