const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv"); 
const http = require("http");
const { Server } = require("socket.io");
dotenv.config({ override: true }); 
const emergencyRoutes = require("./routes/emergencyRoutes");
const authRoutes = require("./routes/authRoutes");
const connectDB = require("./config/db"); 


connectDB(); 


const app = express() ; 
app.use(cors()) ; 
app.use(express.json()) ; 

app.use("/api/auth", authRoutes);
app.use("/api/emergency", emergencyRoutes);

app.get("/", (req, res)=> { 
    res.send("Government Emergency Command Platform — Backend Running")
}); 
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
app.set("io", io);
io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);
});

const PORT = process.env.PORT || 5000 ; 
server.listen(PORT , ()=> { 
    console.log(`Server running on port ${PORT}`);
})