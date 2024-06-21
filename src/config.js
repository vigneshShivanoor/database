

const mongoose = require("mongoose");

const connect = mongoose.connect("mongodb://localhost:27017/user-auth", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

connect
    .then(() => {
        console.log("Connected successfully");
    })
    .catch((error) => {
        console.error("Database connection failed:", error.message);
    });

const LoginSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
});

const collection = mongoose.model("users", LoginSchema);
module.exports = collection;
