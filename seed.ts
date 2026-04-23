import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

// Import models directly using relative paths for the seed script
import User from './frontend/src/models/User';
import Category from './frontend/src/models/Category';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // SUPER_ADMIN
  const hash = await bcrypt.hash('SuperAdmin@123', 12);
  await User.findOneAndUpdate(
    { email: 'superadmin@store.com' },
    {
      name: 'Super Admin',
      email: 'superadmin@store.com',
      passwordHash: hash,
      role: 'SUPER_ADMIN',
      emailVerified: true,
      status: 'ACTIVE',
    },
    { upsert: true, new: true }
  );
  console.log('SUPER_ADMIN user seeded');

  // Sample categories
  const categories = ['Electronics', 'Fashion', 'Home & Kitchen', 'Sports', 'Books'];
  for (const name of categories) {
    const slug = name.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-');
    await Category.findOneAndUpdate(
      { slug },
      { name, slug, isActive: true },
      { upsert: true }
    );
  }
  console.log('Categories seeded');

  console.log('Seed complete');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
