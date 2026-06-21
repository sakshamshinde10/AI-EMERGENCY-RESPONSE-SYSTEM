const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env from parent directory
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const User = require("../models/User");

const users = [
  {
    username: "police_admin",
    password: "police123",
    displayName: "Police Command",
    role: "police",
  },
  {
    username: "fire_admin",
    password: "fire123",
    displayName: "Fire Brigade Command",
    role: "fire",
  },
  {
    username: "hospital_admin",
    password: "hospital123",
    displayName: "Hospital Command",
    role: "hospital",
  },
  {
    username: "super_admin",
    password: "admin123",
    displayName: "Super Administrator",
    role: "admin",
  },
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding...");

    // Clear existing users
    await User.deleteMany({});
    console.log("Cleared existing users.");

    // Create new users (passwords will be hashed by the pre-save hook)
    for (const userData of users) {
      const user = await User.create(userData);
      console.log(`Created user: ${user.username} (${user.role})`);
    }

    console.log("\nSeeding complete! Default users created:");
    console.log("─".repeat(50));
    console.log("  police_admin  / police123    → Police Dashboard");
    console.log("  fire_admin    / fire123      → Fire Dashboard");
    console.log("  hospital_admin/ hospital123  → Hospital Dashboard");
    console.log("  super_admin   / admin123     → Admin Dashboard");
    console.log("─".repeat(50));

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedUsers();
