const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");

require("../database/connection");

const User = require("../models/userModel");
const Restaurant = require("../models/restaurantModel");
const Booking = require("../models/bookingModel");
const Review = require("../models/reviewModel");
const Owner = require("../models/restaurantOwnerModel");
const Blog = require("../models/blogModel");
const Comment = require("../models/commentModel");
const Like = require("../models/likeModel");
const BookedSlot = require("../models/slotModel");

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for each file
  },
});

// router.post("/register", (req, res) => {
//   const { username, password, email, fullName, phoneNumber } = req.body;
//   if (!username || !password || !email || !fullName || !phoneNumber) {
//     return res.status(422).json({ error: "All Fields are Mandatory." });
//   }

//   Owner.findOne({ email: email }).then((userExist) => {
//     if (userExist) {
//       return res.status(422).json({ error: "Email already registered." });
//     }

//     const owner = new Owner({ username, password, email, fullName, phoneNumber });

//     owner.save().then(() => {
//       res.status(201).json({ message: "User Registered Successfully." });
//     }).catch((err) => res.status(500).json({error: "Failed to Register."}))

//   }).catch(err => {console.log(err);});

// });

router.post("/owner-registration", async (req, res) => {
  const { username, password, email, fullName, phoneNumber } = req.body;

  if (!username || !password || !email || !fullName || !phoneNumber) {
    return res.status(422).json({ error: "All Fields are Mandatory." });
  }

  try {
    const emailExist = await Owner.findOne({ email: email });
    const userExist = await Owner.findOne({ username: username });

    if (userExist) {
      return res
        .status(421)
        .json({ error: "User Exist. Enter a different Username." });
    } else if (emailExist) {
      return res.status(423).json({ error: "Email already Registered" });
    }
    const owner = new Owner({
      username,
      password,
      email,
      fullName,
      phoneNumber,
    });

    await owner.save();
    res.status(201).json({ message: "User Registered Successfully." });
  } catch (err) {
    // console.log(err);
  }
});

router.post("/owner-login", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!(username || email) || !password) {
      return res.status(400).json({ error: "Fill all data." });
    }

    let restaurantOwner;
    if (username) {
      restaurantOwner = await Owner.findOne({ username: username });
    } else if (email) {
      restaurantOwner = await Owner.findOne({ email: email });
    }

    if (restaurantOwner) {
      const isMatch = await bcrypt.compare(password, restaurantOwner.password);

      const token = await restaurantOwner.generateAuthToken();
      // console.log(token);

      res.cookie("jwtoken", token, {
        expires: new Date(Date.now() + 36000000),
        httpOnly: true,
        secure: true, // Set to true in production (for HTTPS)
        sameSite: "none",
      });

      if (!isMatch) {
        res.status(400).json({ error: "Invalid Credentials." });
      } else {
        res.status(201).json({ message: "Login Success." });
      }
    } else {
      res.status(400).json({ error: "Invalid Credentials." });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/update-owner-details", authMiddleware, async (req, res) => {
  const userId = req.user._id;
  const { username, email, fullName, phoneNumber } = req.body;

  if (!username || !email || !fullName || !phoneNumber) {
    return res.status(422).json({ error: "All Fields are Mandatory." });
  }

  try {
    const existingUser = await Owner.findById(userId);

    if (!existingUser) {
      return res.status(404).json({ error: "User not found." });
    }

    // Update user's details if provided, otherwise keep the existing values
    existingUser.username = username || existingUser.username;
    existingUser.email = email || existingUser.email;
    existingUser.fullName = fullName || existingUser.fullName;
    existingUser.phoneNumber = phoneNumber || existingUser.phoneNumber;

    await existingUser.save();
    res.status(200).json({ message: "User details updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/owner-home", authMiddleware, (req, res) => {
  res.send(req.user);
});

router.get("/owner-logout", authMiddleware, (req, res) => {
  res.clearCookie("jwtoken");
  res.status(200).send("Logged Out Successfully.");
});

router.get("/add-restaurant", authMiddleware, (req, res) => {
  res.send(req.user);
  if (req.user) {
    res.status(200);
  }
});

router.post(
  "/add-restaurant",
  authMiddleware,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "menu", maxCount: 5 },
  ]),
  async (req, res) => {
    const owner = req.user;
    const {
      name,
      city,
      area,
      location,
      averageCostForTwo,
      cuisine,
      startTime,
      endTime,
      contactNumber,
      website,
      extraDiscount,
      types,
      offers,
      amenities,
    } = req.body;

    if (!name || !city || !area || !location || !contactNumber) {
      res.status(402).json({ error: "Marked Fields Are Mandatory" });
      return;
    } else if (!owner) {
      res.status(403).json({ error: "Unauthorized Access." });
      return;
    }

    try {
      const ownerDetails = {
        _id: owner._id,
        username: owner.username,
        email: owner.email,
        fullName: owner.fullName,
        phoneNumber: owner.phoneNumber,
      };

      let images = [];
      if (req.files["images"]) {
        images = req.files["images"].map((file) => ({
          data: file.buffer,
          contentType: file.mimetype,
        }));
      }

      let menu = [];
      if (req.files["menu"]) {
        menu = req.files["menu"].map((file) => ({
          data: file.buffer,
          contentType: file.mimetype,
        }));
      }
      const restaurant = new Restaurant({
        name,
        city,
        area,
        location,
        averageCostForTwo,
        cuisine,
        startTime,
        endTime,
        contactNumber,
        website,
        extraDiscount,
        types,
        offers,
        amenities,
        images: images,
        menu: menu,
        owner: ownerDetails,
      });

      await restaurant.save();

      owner.restaurants.push({
        _id: restaurant._id,
        name: restaurant.name,
        city: restaurant.city,
        location: restaurant.location,
      });

      await owner.save();

      res.status(200).json({ message: "Restaurant Added Successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.get("/restaurant/:restaurantId", authMiddleware, async (req, res) => {
  const owner = req.user;

  if (owner) {
    const { restaurantId } = req.params;

    try {
      const restaurant = await Restaurant.findById(restaurantId).select(
        "-owner -reviews"
      );

      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      res.status(200).json({ restaurant });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.status(403).json({ error: "Unauthorized Access." });
  }
});

router.put("/update-restaurant/:restaurantId", async (req, res) => {
  const { restaurantId } = req.params;

  try {
    const restaurant = await Restaurant.findById(restaurantId).select(
      "-owner -reviews"
    );

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    Object.assign(restaurant, req.body);

    const updatedRestaurant = await restaurant.save();

    const restaurantOwner = await Owner.findOne({ restaurantId });

    if (restaurantOwner) {
      Object.assign(restaurantOwner, req.body);

      await restaurantOwner.save();
    }

    res.status(200).json({ restaurant: updatedRestaurant });
  } catch (error) {
    console.error("Error updating restaurant:", error);
    res.status(500).json({ error: "Failed to update restaurant details" });
  }
});

router.delete(
  "/delete-restaurant/:restaurantId",
  authMiddleware,
  async (req, res) => {
    const owner = req.user;
    const restaurantId = req.params.restaurantId;

    try {
      if (!owner) {
        res.status(403).json({ error: "Unauthorized Access." });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
        res.status(400).json({ error: "Invalid Restaurant ID." });
        return;
      }

      const restaurant = await Restaurant.findById(restaurantId);

      if (!restaurant) {
        res.status(404).json({ error: "Restaurant not found." });
        return;
      }

      if (!restaurant.owner._id.equals(owner._id)) {
        res.status(403).json({ error: "Unauthorized Access." });
        return;
      }

      await restaurant.deleteOne();

      owner.restaurants = owner.restaurants.filter(
        (rest) => !rest.equals(restaurant._id)
      );
      await owner.save();

      res.status(200).json({ message: "Restaurant Deleted Successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.get("/restaurants-slider", async (req, res) => {
  try {
    const { city } = req.query;
    const restaurants = await Restaurant.find({ city: city })
      .limit(15)
      .select("-owner")
      .populate({
        path: "reviews",
        select: "rating comment",
      });

    res.json({ restaurants });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/restaurants", async (req, res) => {
  try {
    const { city, area, location, cuisine, types, amenities } = req.query;
    if (!city) {
      return res.status(400).json({ error: "City parameter is missing." });
    }

    let query = { city };
    if (area) {
      query.area = area;
    }

    if (location) {
      query.location = location;
    }

    if (cuisine) {
      query.cuisine = cuisine;
    }

    if (types) {
      query.types = types;
    }

    if (amenities) {
      query.amenities = amenities;
    }

    const restaurants = await Restaurant.find(query).select("-owner").populate({
      path: "reviews",
    });
    res.status(200).json({ restaurants });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/restaurants-names", async (req, res) => {
  try {
    const { _id } = req.query;

    const restaurants = await Restaurant.findById(_id).select("-owner");
    res.status(200).json({ restaurants });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:city/:area/:name/:_id", async (req, res) => {
  const { city, area, name, _id } = req.params;
  try {
    const restaurant = await Restaurant.findById(_id)
      .select("-owner")
      .populate({
        path: "reviews",
        populate: {
          path: "reviewedBy",
          model: "User",
          select: "fullName image",
        },
      });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    res.status(200).json({ restaurant });
  } catch (error) {
    console.error("Error fetching restaurant details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/book", async (req, res) => {
  try {
    const {
      userEmail,
      fullName,
      userId,
      restaurantId,
      phoneNumber,
      numberOfPeople,
      bookingDate,
      entryTime,
      specialRequest,
    } = req.body;

    if (!userId || !phoneNumber) {
      res.status(402).json({ error: "Marked Fields Are Mandatory" });
      return;
    }

    const existingBooking = await Booking.findOne({
      bookedBy: userId,
      restaurant: restaurantId,
      bookingDate,
    });

    if (existingBooking) {
      existingBooking.numberOfPeople = req.body.numberOfPeople;
      existingBooking.entryTime = req.body.entryTime;
      existingBooking.specialRequest = req.body.specialRequest;
      existingBooking.status = "Pending";

      await existingBooking.save();

      // Update the time slot directly in the bookedSlot schema
      const updatedSlot = await BookedSlot.findOneAndUpdate(
        {
          restaurant: restaurantId,
          bookingDate,
          "slots.bookingId": existingBooking._id,
        },
        { $set: { "slots.$.time": entryTime } },
        { new: true }
      );

      if (!updatedSlot) {
        // If the slot doesn't exist, create a new one
        const newSlot = new BookedSlot({
          restaurant: restaurantId,
          bookingDate,
          slots: [{ time: entryTime, bookingId: existingBooking._id }],
        });
        await newSlot.save();
      }

      return res.status(201).json({ message: "Booking updated successfully!" });
    }

    const newBooking = new Booking({
      bookedBy: userId,
      restaurant: restaurantId,
      numberOfPeople,
      bookingDate,
      entryTime,
      specialRequest,
    });

    await newBooking.save();

    // Find or create a BookedSlot document for the given date and restaurant
    let bookedSlot = await BookedSlot.findOne({
      restaurant: restaurantId,
      bookingDate,
    });

    if (!bookedSlot) {
      bookedSlot = new BookedSlot({
        restaurant: restaurantId,
        bookingDate,
        slots: [{ time: entryTime, bookingId: newBooking._id }],
      });
    } else {
      const existingSlot = bookedSlot.slots.find(
        (slot) => slot.time === entryTime
      );
      if (existingSlot) {
        existingSlot.bookingId = newBooking._id;
      } else {
        bookedSlot.slots.push({ time: entryTime, bookingId: newBooking._id });
      }
    }

    await bookedSlot.save();

    const existingUser = await User.findOne({ userEmail });

    if (!existingUser) {
      const newUser = new User({
        userEmail,
        fullName,
        phoneNumber,
        creationTime,
        lastSignInTime,
      });

      await newUser.save();
      existingUser = newUser;
    } else {
      existingUser.phoneNumber = phoneNumber;
      await existingUser.save();
    }

    const updatedUser = await User.findOne({ userEmail });
    updatedUser.bookings.push(newBooking._id);
    await updatedUser.save();

    const bookingRestaurant = await Restaurant.findOne({ _id: restaurantId });
    bookingRestaurant.bookings.push(newBooking._id);
    await bookingRestaurant.save();

    res.status(200).json({ message: "Booking successful!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/bookedSlots/:restaurantId/:bookingDate", async (req, res) => {
  try {
    const { restaurantId, bookingDate } = req.params;

    // Find the booked slots for the given restaurant and booking date
    const bookedSlots = await BookedSlot.findOne({
      restaurant: restaurantId,
      bookingDate: bookingDate,
    });

    if (!bookedSlots) {
      return res.status(201).json({
        message: "No booked slots found for this date and restaurant.",
      });
    }

    const timeSlots = bookedSlots.slots.map((slot) => slot.time);

    res.status(200).json(timeSlots);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/bookings", async (req, res) => {
  try {
    const { userEmail } = req.query;
    // Validate if userEmail is provided
    if (!userEmail) {
      return res.status(400).json({ error: "User not Found." });
    }

    // Fetch booking details based on user email
    const bookings = await Booking.find({ userEmail: userEmail.toLowerCase() });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/bookings/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: "Cancelled" },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // finds the booked slot document for the restaurant and booking date
    const bookedSlot = await BookedSlot.findOne({
      restaurant: updatedBooking.restaurant,
      bookingDate: updatedBooking.bookingDate,
    });

    if (bookedSlot) {
      // removes the slot with the given bookingId
      bookedSlot.slots = bookedSlot.slots.filter(
        (slot) => !slot.bookingId.equals(bookingId)
      );

      await bookedSlot.save();
    }

    res.status(200).json(updatedBooking);
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/reservations", async (req, res) => {
  try {
    const { restaurant } = req.query;
    if (!restaurant) {
      return res.status(400).json({ error: "User not Found." });
    }

    const reservations = await Booking.find({
      restaurant: restaurant,
    }).populate({
      path: "bookedBy",
      model: "User",
      select: "userEmail fullName phoneNumber",
    });

    res.status(200).json(reservations);
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.patch("/reservations/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.status(200).json(updatedBooking);
  } catch (error) {
    console.error(`Error updating booking:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/add-review", async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      rating,
      comment,
      liked,
      disLiked,
      canBeImproved,
    } = req.body;

    if (!userEmail || !rating) {
      res.status(402).json({ error: "Attributes Missing." });
      return;
    }

    const user = await User.findOne({ userEmail });

    const restaurantId = req.query.restaurantId;
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const existingReview = await Review.findOne({
      reviewedBy: userId,
      restaurant: restaurantId,
    });

    if (existingReview) {
      // If a review exists, update it
      existingReview.rating = rating;
      existingReview.comment = comment;
      existingReview.liked = liked;
      existingReview.disLiked = disLiked;
      existingReview.canBeImproved = canBeImproved;
      await existingReview.save();
      res.status(200).json({ message: "Review updated successfully" });
    } else {
      // If no review exists, create a new one
      const newReview = new Review({
        reviewedBy: userId,
        restaurant: restaurantId,
        rating,
        comment,
        liked,
        disLiked,
        canBeImproved,
      });

      // Save the new review
      await newReview.save();

      // Add the review to the user's reviews array
      user.reviews.push(newReview);
      await user.save();

      // Add the review to the restaurant's reviews array
      restaurant.reviews.push(newReview);
      await restaurant.save();

      res.status(201).json({ message: "Review submitted successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/reviews", async (req, res) => {
  try {
    const { restaurantId, userEmail } = req.query;

    // Validate if either restaurantId or userEmail is provided
    if (!restaurantId && !userEmail) {
      return res.status(400).json({ error: "Restaurant or User not Found." });
    }

    // Fetch review details based on restaurantId or userEmail
    const reviews = await Review.find({
      $or: [{ restaurant: restaurantId }, { userEmail: userEmail }],
    });

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching review details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/add-user", async (req, res) => {
  try {
    const { fullName, userEmail, creationTime, lastSignInTime } = req.body;

    let user = await User.findOne({ userEmail });

    if (fullName && userEmail && creationTime && lastSignInTime) {
      if (!user) {
        user = new User({
          userEmail,
          fullName,
          creationTime,
          lastSignInTime,
        });
        await user.save();
        res.status(200).json({ message: "User Created." });
      } else {
        res.status(202).json({ message: "User exist." });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/user-info", async (req, res) => {
  try {
    const { userEmail } = req.query;

    // Validate
    if (!userEmail) {
      return res.status(400).json({ error: "User not Found." });
    }

    // Fetch user details based on userEmail
    const user = await User.findOne({ userEmail: userEmail })
      .populate({
        path: "reviews",
        populate: {
          path: "restaurant",
          model: "Restaurant",
          select: "name city area",
        },
      })
      .populate({
        path: "bookings",
        populate: {
          path: "restaurant",
          model: "Restaurant",
          select: "name city area",
        },
      })
      .populate({
        path: "blogs",
      })
      .populate({
        path: "likes",
        populate: [
          {
            path: "blog",
            model: "Blog",
            select: "title category postedBy",
          },
          {
            path: "blog",
            populate: {
              path: "postedBy",
              model: "User",
              select: "fullName",
            },
          },
        ],
      })
      .populate({
        path: "comments",
        populate: [
          {
            path: "blog",
            model: "Blog",
            select: "title category postedBy",
          },
          {
            path: "blog",
            populate: {
              path: "postedBy",
              model: "User",
              select: "fullName",
            },
          },
        ],
      });

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/user-image", async (req, res) => {
  try {
    let user;
    const { userEmail, userId } = req.query;

    if (userEmail) {
      user = await User.findOne({ userEmail }).select("image");
    } else if (userId) {
      user = await User.findById(userId).select("image");
    } else {
      return res.status(400).json({ error: "Missing query parameters" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ image: user.image });
  } catch (error) {
    console.error("Error fetching user image:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    const { userEmail } = req.query;
    const user = await User.findOne({ userEmail: userEmail });

    // Update user's image data
    user.image.data = req.file.buffer;
    user.image.contentType = req.file.mimetype;

    await user.save();

    res.status(200).json({ message: "Image uploaded successfully" });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/post-blog", upload.single("image"), async (req, res) => {
  try {
    const { title, content, mainContent, category, postedBy } = req.body;
    const user = await User.findOne({ _id: postedBy });

    const newBlog = new Blog({
      title,
      content,
      mainContent: JSON.parse(mainContent),
      category,
      postedBy,
    });

    if (req.file) {
      newBlog.image.data = req.file.buffer;
      newBlog.image.contentType = req.file.mimetype;
    }

    await newBlog.save();

    user.blogs.push(newBlog);
    await user.save();

    res.status(201).json({ message: "Blog post created successfully" });
  } catch (error) {
    console.error("Error creating blog post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/blogs/all-available/fetch-all", async (req, res) => {
  try {
    const blogs = await Blog.find().populate({
      path: "postedBy",
      select: "fullName image",
    });

    if (blogs.length === 0) {
      return res.status(404).json({ message: "No blogs found" });
    }
    res.status(200).json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/blog/individual-blogs", async (req, res) => {
  try {
    const { blogID, blogCat } = req.query;

    // Validate if blogID or blogCat is provided
    if (!blogID && !blogCat) {
      return res
        .status(400)
        .json({ error: "Blog ID or Category not provided." });
    }

    // Fetch blog details based on blogID or blogCat
    let blogs;
    if (blogID) {
      blogs = await Blog.findById(blogID)
        .populate({
          path: "postedBy",
          select: "fullName image",
        })
        .populate({
          path: "comments",
          populate: {
            path: "commentedBy",
            select: "fullName image",
          },
        });
    } else {
      blogs = await Blog.find({ category: blogCat }).populate({
        path: "postedBy",
        select: "fullName image",
      });
    }

    res.status(200).json(blogs);
  } catch (error) {
    console.error("Error fetching Blog details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/similar-blog", async (req, res) => {
  try {
    const { blogCategory } = req.query;

    // Validate if blogCategory is provided
    if (!blogCategory) {
      return res.status(400).json({ error: "Blog category not provided." });
    }

    // Fetch blog details based on blogCategory
    const blogs = await Blog.find({ category: blogCategory }).select(
      "_id title date"
    );

    res.status(200).json(blogs);
  } catch (error) {
    console.error("Error fetching blog details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/like-blog", async (req, res) => {
  try {
    const { blogID, userID } = req.body;
    const user = await User.findById(userID);
    const blog = await Blog.findById(blogID);

    const existingLike = await Like.findOne({
      blog: blogID,
      likedBy: userID,
    });
    if (existingLike) {
      return res.status(400).json({ message: "Blog already liked" });
    }

    const like = new Like({ blog: blogID, likedBy: userID });
    await like.save();

    user.likes.push(like);
    await user.save();

    blog.likes.push(like);
    await blog.save();

    res.status(201).json({ message: "Blog liked successfully" });
  } catch (error) {
    console.error("Error liking blog:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/unlike-blog", async (req, res) => {
  try {
    const { blogID, userID } = req.body;
    const user = await User.findById(userID);
    const blog = await Blog.findById(blogID);

    const existingLike = await Like.findOneAndDelete({
      blog: blogID,
      likedBy: userID,
    });
    if (!existingLike) {
      return res.status(400).json({ message: "Blog not liked by user" });
    }

    blog.likes.pull(existingLike);
    await blog.save();

    user.likes.pull(existingLike);
    await user.save();

    res.status(200).json({ message: "Blog unliked successfully" });
  } catch (error) {
    console.error("Error unliking blog:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/post-comment", async (req, res) => {
  try {
    const { blogID, comment, userID } = req.body;
    const user = await User.findById(userID);
    const blog = await Blog.findById(blogID);

    const existingComment = await Comment.findOne({
      blog: blogID,
      commentedBy: userID,
    }).populate({
      path: "commentedBy",
      select: "fullName image",
    });

    if (existingComment) {
      existingComment.comment = comment;
      await existingComment.save();
      res.status(200).json({ comment: existingComment });
    } else {
      const newComment = new Comment({
        comment,
        blog: blogID,
        commentedBy: userID,
      });
      await newComment.save();

      await User.populate(newComment, {
        path: "commentedBy",
        select: "fullName image",
      });

      user.comments.push(newComment);
      await user.save();

      blog.comments.push(newComment);
      await blog.save();
      res.status(201).json({ comment: newComment });
    }
  } catch (error) {
    console.error("Error posting/commenting:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
