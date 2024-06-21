const express = require('express');
const path = require("path");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const app = express();
const collection = require("./config");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use(express.static("public"));

// Define the rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});

// Apply the rate limiter to all requests
app.use(apiLimiter);

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/signup", async (req, res) => {
    const data = {
        name: req.body.username,
        password: req.body.password
    };

    const existingUser = await collection.findOne({ name: data.name });
    if (existingUser) {
        res.send("User already exists");
    } else {
        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);
            data.password = hashedPassword;
            const userdata = await collection.insertMany(data);
            console.log(userdata);
            res.send("User registered successfully");
        } catch (error) {
            console.error('Error hashing password:', error);
            res.status(500).send("Error registering user");
        }
    }
});

app.post("/login", async (req, res) => {
    try {
        const check = await collection.findOne({ name: req.body.username });
        if (!check) {
            res.send("User does not exist");
        } else {
            const isPassword = await bcrypt.compare(req.body.password, check.password);
            if (isPassword) {
                res.render("home");
            } else {
                res.send("Wrong password");
            }
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send("Something went wrong");
    }
});

app.get("/users", async (req, res) => {
    try {
        const { name, page = 1, limit = 10 } = req.query;
        let filter = {};
        if (name) {
            filter = { name: { $regex: new RegExp(name, "i") } };
        }
        const users = await collection.find(filter)
            .skip((page - 1) * limit)
            .limit(limit);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send("Error fetching users");
    }
});

app.put("/users/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const userData = {
            name: req.body.username,
            password: req.body.password
        };

        const updatedUser = await collection.findOneAndUpdate({ _id: userId }, userData, { new: true });

        if (!updatedUser) {
            return res.status(404).send("User not found");
        }

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send("Error updating user");
    }
});

app.patch("/users/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const userData = {
            name: req.body.username,
            password: req.body.password
        };

        const updatedUser = await collection.findOneAndUpdate({ _id: userId }, { $set: userData }, { new: true });

        if (!updatedUser) {
            return res.status(404).send("User not found");
        }

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send("Error updating user");
    }
});

app.delete("/users/:id", async (req, res) => {
    try {
        const userId = req.params.id;

        const deletedUser = await collection.findOneAndDelete({ _id: userId });

        if (!deletedUser) {
            return res.status(404).send("User not found");
        }

        res.send("User deleted successfully");
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send("Error deleting user");
    }
});

app.head("/users/:id", async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await collection.findOne({ _id: userId });

        if (!user) {
            return res.status(404).send("User not found");
        }

        res.send("User exists");
    } catch (error) {
        console.error('Error checking user existence:', error);
        res.status(500).send("Error checking user existence");
    }
});

app.options("/users", (req, res) => {
    res.set("Allow", "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS");
    res.send();
});

const port = 5000;
app.listen(port, () => {
    console.log(`Server running on Port: ${port}`);
});
