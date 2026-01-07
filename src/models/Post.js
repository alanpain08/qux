const { Schema, model } = require('mongoose');

const postSchema = new Schema(
  {
    postId: { type: String, required: true, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = model('Post', postSchema);
