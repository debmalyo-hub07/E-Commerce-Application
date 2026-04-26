const mongoose = require("mongoose");

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("MONGODB_URI environment variable is missing.");
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  
  const User = mongoose.connection.collection("users");
  
  // Delete all users except the specific one
  const deleteResult = await User.deleteMany({ email: { $ne: "debmalyobarman2003@gmail.com" } });
  console.log(`Deleted ${deleteResult.deletedCount} users.`);

  // Update the specific one to ADMIN
  const updateResult = await User.updateOne(
    { email: "debmalyobarman2003@gmail.com" },
    { $set: { role: "ADMIN", status: "ACTIVE" } }
  );
  console.log(`Updated to ADMIN:`, updateResult.modifiedCount > 0);

  mongoose.disconnect();
}

run().catch(console.error);
