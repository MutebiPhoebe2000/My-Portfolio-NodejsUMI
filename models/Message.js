

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    name: { type: String, trim: true, maxlength: 100 },
    gender: { type: String, trim: true, maxlength: 20 },
    address: { type: String, trim: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 30 },
    company: { type: String, trim: true, maxlength: 100 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    subject: { type: String, trim: true, maxlength: 50 },
    message: { type: String, trim: true, maxlength: 5000 }
});

module.exports = mongoose.model("Message", messageSchema);





