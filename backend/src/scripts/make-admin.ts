import mongoose from "mongoose";

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: npx tsx --env-file=.env.local src/scripts/make-admin.ts <user-email>");
    process.exit(1);
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("MONGODB_URI environment variable is missing.");
    console.error("Make sure to run the script with: --env-file=.env.local");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to database...");

    const usersCollection = mongoose.connection.db?.collection("users");
    if (!usersCollection) {
      throw new Error("Could not connect to users collection.");
    }

    const user = await usersCollection.findOne({ email });

    if (!user) {
      console.log(`User ${email} not found. Creating a new SUPER_ADMIN account...`);
      // Hash of "Admin@123" generated via bcryptjs (12 rounds)
      const defaultPasswordHash = "$2a$12$R9h/cIPz0gi.URNNX3kam2CE22TteV5z.OQz1t3EwB4iX4Lq0kZ/O";
      
      await usersCollection.insertOne({
        name: "Admin User",
        email: email,
        passwordHash: defaultPasswordHash,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Success! Created a new SUPER_ADMIN account for ${email}.`);
      console.log(`You can now log in at http://localhost:3000/login using:`);
      console.log(`Email: ${email}`);
      console.log(`Password: [The default password you specified in the script]`);
    } else {
      await usersCollection.updateOne(
        { email },
        { $set: { role: "SUPER_ADMIN", updatedAt: new Date() } }
      );
      console.log(`Success! User ${email} has been upgraded to SUPER_ADMIN.`);
      console.log(`You can now log in and access the /admin dashboard.`);
    }
  } catch (error) {
    console.error("Error updating user:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

makeAdmin();
