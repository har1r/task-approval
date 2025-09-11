const mongoose = require("mongoose");

const titleSeqSchema = new mongoose.Schema({
  title: { type: String, required: true }, // judul task
  seq: { type: Number, required: true },   // nomor export
});

const exportCounterSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  seq: { type: Number, default: 0 },       // seq global untuk title baru
  titles: [titleSeqSchema],
});

module.exports = mongoose.model("ExportCounter", exportCounterSchema);