const mongoose = require("mongoose");

const sourceSchema = new mongoose.Schema(
  {
    sourceName: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    author: {
      type: String,
      default: "Unknown",
      trim: true,
    },

    publishedAt: {
      type: Date,
    },

    snippet:{type:String,default:"",trim:true},

    imageUrl:{type:String,default:"",trim:true},
  },
  { _id: false }
);

const storySchema = new mongoose.Schema(
  {
    headline: {
      type: String,
      required: true,
      trim: true,
    },

    summary: {
      type: String,
      required: true,
      trim: true,
    },

    whyItMatters: {
      type: String,
      default: "",
      trim: true,
    },

    imageUrl:{type:String,default:"",trim:true},
    imageProvider:{type:String,default:"",trim:true},
    imagePhotographer:{type:String,default:"",trim:true},
    imagePhotographerUrl:{type:String,default:"",trim:true},
    keywords:{type:[String],default:[]},

    category: {
      type: String,
      default: "General",
      trim: true,
    },

    publishedAt: {
      type: Date,
      default: Date.now,
    },

    sources: {
      type: [sourceSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Story", storySchema);