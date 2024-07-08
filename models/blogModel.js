const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed, // handles various structures for different block types
    required: true,
  },
});

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    //or summery
    type: String,
    required: true,
  },
  mainContent: {
    time: {
      type: Number,
      required: true,
    },
    blocks: [blockSchema],
    version: {
      type: String,
      required: true,
    },
  },
  category: {
    type: String,
  },
  image: {
    data: Buffer,
    contentType: String,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
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
});

module.exports = mongoose.model("Blog", blogSchema);
