import mongoose from "mongoose";

const OddsSchema = new mongoose.Schema({
  marketId: { type: String, index: true, required: true },
  eventId: { type: Number },
  eventName: { type: String },
  competition: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
  odds: { type: mongoose.Schema.Types.Mixed }, // store runners array / object
});

export default mongoose.model("Odds", OddsSchema);

