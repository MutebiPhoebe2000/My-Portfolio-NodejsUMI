// const express = require("express");
// const mongoose = require("mongoose");
// const Message = require("./models/Message");

// const app = express();

// // middleware
// app.use(express.json());

// // MongoDB connection
// mongoose.connect("mongodb://127.0.0.1:27017/mydatabase")
// .then(() => {
//   console.log("MongoDB connected successfully");
// })
// .catch((error) => {
//   console.log("MongoDB connection error:", error);
// });

// // route to save message
// app.post("/message", async (req, res) => {
//   try {
//     const newMessage = new Message(req.body);
//     await newMessage.save();
//     res.send("Message saved successfully");
//   } catch (error) {
//     res.status(500).send("Error saving message");
//   }
// });

// // start server
// app.listen(3000, () => {
//   console.log("Server running on port 3003");
// });