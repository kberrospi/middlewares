const mongoose = require("mongoose");

const PageViewSchema = new mongoose.Schema({
  path: { type: String },
  date: { type: Date },
  userAgent: {type: String},
});
PageViewSchema.methods.truncateBody = function() {
  if (this.body && this.body.length > 75) {
    return this.body.substring(0, 70) + " ...";
  }
  return this.body;
};
module.exports = mongoose.model("Page", PageViewSchema);