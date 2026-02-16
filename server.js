require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI);

// MODELOS
const User = mongoose.model("User", {
    username: String,
    password: String
});

const Message = mongoose.model("Message", {
    user: String,
    text: String,
    image: String,
    date: { type: Date, default: Date.now }
});

// REGISTRO
app.post("/register", async (req, res) => {
    const hash = await bcrypt.hash(req.body.password, 10);
    await User.create({ username: req.body.username, password: hash });
    res.json({ success: true });
});

// LOGIN
app.post("/login", async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.json({ success: false });

    const valid = await bcrypt.compare(req.body.password, user.password);
    res.json({ success: valid });
});

// SOCKET
io.on("connection", (socket) => {

    socket.on("join", async (username) => {
        socket.username = username;

        socket.broadcast.emit("system", username + " está online");

        const messages = await Message.find().sort({ date: 1 }).limit(50);
        socket.emit("load messages", messages);
    });

    socket.on("message", async (data) => {
        await Message.create(data);
        io.emit("message", data);
    });

    socket.on("typing", () => {
        socket.broadcast.emit("typing", socket.username);
    });

    socket.on("disconnect", () => {
        if (socket.username) {
            socket.broadcast.emit("system", socket.username + " se desconectó");
        }
    });
});

server.listen(process.env.PORT || 3000);
