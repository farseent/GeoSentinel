const mongoose = require("mongoose");
const { REQUEST_STATUS } = require("../utils/constants");

const requestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coordinates: {
      // Rectangle AOI: { north, south, east, west }
      type: {
        north: { type: Number, required: true },
        south: { type: Number, required: true },
        east: { type: Number, required: true },
        west: { type: Number, required: true },
      },
      required: true,
    },
    dateFrom: {
      type: Date,
      required: true,
    },
    dateTo: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.PENDING,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);