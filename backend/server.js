const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
const socketio = require("socket.io");

dotenv.config(); // Load environment variables from .env file
connectDB(); // Connect to MongoDB or your database of choice

const app = express();

// Middleware to parse JSON bodies of incoming requests
app.use(express.json());

// Routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Serve static assets if in production
const __dirname1 = path.resolve();
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// Error Handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000; // Default port is 5000 if not specified in .env

const server = app.listen(PORT, () =>
  console.log(`Server running on PORT ${PORT}...`)
);

// Socket.io setup
const io = socketio(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3001", // Allow requests from frontend
    // credentials: true, // Uncomment if using credentials
  },
});

// Socket.io event handlers
io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageReceived) => {

    const chat = newMessageReceived.chat;
   


    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      console.log("user " + user.name + " user id " + user._id);
      if (user._id == newMessageReceived.sender._id) return;
      
   
      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
    // Clean up any necessary resources here
  });
});
