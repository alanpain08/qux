const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    tgId: { type: Number, required: true, unique: true, index: true },
    username: String,
    firstName: String,
    lastAdAt: Date,
    adCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = model('User', userSchema);
