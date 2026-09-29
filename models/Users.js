const mongoose = require("mongoose");
const passportLocalMangoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        trim: true
    },

    gender: {
        type: String,
        enum: ['Male', 'Female'],
    },

    address: {
        type: String,
        trim: true
    },

    phone: {
        type: String,
        trim: true
    },
    company: {
        type: String,
        trim: true
    },

    email: {
        type: String,
        lowercase: true,
        trim: true
    }

});

userSchema.plugin(passportLocalMangoose, {
  usernameField: "email",
});
module.exports = mongoose.model("Users", userSchema);





