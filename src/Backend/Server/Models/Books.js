const mongoose = require('mongoose')

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String, required: true },
    category: { type: String },
    quantity: { type: Number, default: 1 },
    available: { type: Number, default: 1 }
  },
  { timestamps: true ,
    collection: 'books'
  }
)

module.exports = mongoose.model('Books', bookSchema)