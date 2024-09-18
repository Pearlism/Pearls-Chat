const express = require("express");
const { connection } = require("./config/db");
const { userRoutes } = require("./routes/User.Routes");
const { groupRoutes } = require("./routes/Group.Routes");
const { UserModel } = require("./model/User.Model");
const { createServer } = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB URI from environment variables
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Your application code
const port = process.env.PORT || 7895;  // Use environment variable or default port
console.log(`Server Port: ${port}`);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Server online. Make sure your ports are correct in '/scripts' - Made By Landen419 - github.com/pearlism");
});

app.use("/user", userRoutes);
app.use("/group", groupRoutes);

const obj = {};

io.on("connection", (socket) => {
    console.log("Connection Established");

    socket.on("createConnection", (userId) => {
        obj[userId] = socket.id;
    });

    socket.on("chatMsg", async (msg, receiverId, senderId) => {
        let newMsg = {
            message: msg,
            senderId: senderId,
            receiverId: receiverId,
        };

        try {
            await UserModel.updateOne(
                { _id: senderId },
                { $push: { chatMessageModel: newMsg } }
            );
            await UserModel.updateOne(
                { _id: receiverId },
                { $push: { chatMessageModel: newMsg } }
            );

            // Send private message to individual socket ID
            io.to(obj[receiverId]).emit("receivedMsg", msg, senderId);
        } catch (error) {
            console.error('Error updating messages:', error);
        }
    });

    socket.on("disconnect", () => {
        console.log("Connection Terminated");
    });
});

httpServer.listen(port, async () => {
    try {
        await connection;
        console.log("Successfully Connected to the Pearl Server");
        console.log(`Server Port: ${port}`);
        console.log("Made By Landen419 - github.com/pearlism");
    } catch (error) {
        console.error('Error starting server:', error);
    }
});
