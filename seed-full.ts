import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Use MONGODB_URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

import User from './frontend/src/models/User';
import Category from './frontend/src/models/Category';
import Product from './frontend/src/models/Product';
import Coupon from './frontend/src/models/Coupon';
import Review from './frontend/src/models/Review';


async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log('✅ Connected to MongoDB');

  // ── 1. Admin Users ────────────────────────────────────────
  const superHash = await bcrypt.hash('SuperAdmin@123', 12);
  const adminHash = await bcrypt.hash('Admin@123456', 12);

  const superAdmin = await User.findOneAndUpdate(
    { email: 'superadmin@store.com' },
    {
      name: 'Super Admin',
      email: 'superadmin@store.com',
      passwordHash: superHash,
      role: 'ADMIN',
      emailVerified: true,
      status: 'ACTIVE',
    },
    { upsert: true, new: true }
  );
  console.log('✅ Super Admin seeded: superadmin@store.com / SuperAdmin@123');

  await User.findOneAndUpdate(
    { email: 'admin@nexmart.in' },
    {
      name: 'Store Admin',
      email: 'admin@nexmart.in',
      passwordHash: adminHash,
      role: 'ADMIN',
      emailVerified: true,
      status: 'ACTIVE',
    },
    { upsert: true, new: true }
  );
  console.log('✅ Admin seeded: admin@nexmart.in / Admin@123456');

  // ── 2. Sample Customer ────────────────────────────────────
  const customerHash = await bcrypt.hash('Customer@123', 12);
  await User.findOneAndUpdate(
    { email: 'customer@example.com' },
    {
      name: 'Rahul Sharma',
      email: 'customer@example.com',
      passwordHash: customerHash,
      role: 'CUSTOMER',
      emailVerified: true,
      status: 'ACTIVE',
    },
    { upsert: true, new: true }
  );
  console.log('✅ Customer seeded: customer@example.com / Customer@123');

  // ── 3. Categories ─────────────────────────────────────────
  const categoryData = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Fashion', slug: 'fashion' },
    { name: 'Home & Kitchen', slug: 'home-kitchen' },
    { name: 'Sports & Fitness', slug: 'sports-fitness' },
    { name: 'Books', slug: 'books' },
    { name: 'Beauty & Personal Care', slug: 'beauty-personal-care' },
  ];

  const categoryMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const cat of categoryData) {
    const c = await Category.findOneAndUpdate(
      { slug: cat.slug },
      { name: cat.name, slug: cat.slug, isActive: true },
      { upsert: true, new: true }
    );
    categoryMap[cat.slug] = c._id;
  }
  console.log('✅ 6 Categories seeded');

  // ── 4. Products ───────────────────────────────────────────
  const adminId = superAdmin!._id;

  const products = [
    // Electronics
    {
      name: 'Sony WH-1000XM5 Wireless Headphones',
      slug: 'sony-wh-1000xm5-wireless-headphones',
      description: '<p>Industry-leading noise cancelling with Dual Noise Sensor technology. Next-level music with Integrated Processor V1. Crystal clear hands-free calling. 30-hour battery life with quick charging.</p>',
      brand: 'Sony',
      categoryId: categoryMap['electronics'],
      basePrice: 34990,
      sellingPrice: 26990,
      gstPercent: 18,
      discountPercent: 23,
      stockQuantity: 45,
      isActive: true,
      isFeatured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', publicId: 'sony-headphones-1', isPrimary: true, displayOrder: 0 }],
      createdBy: adminId,
    },
    {
      name: 'Apple iPhone 15 Pro (256GB) - Natural Titanium',
      slug: 'apple-iphone-15-pro-256gb-natural-titanium',
      description: '<p>Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever.</p>',
      brand: 'Apple',
      categoryId: categoryMap['electronics'],
      basePrice: 134900,
      sellingPrice: 129900,
      gstPercent: 18,
      discountPercent: 4,
      stockQuantity: 20,
      isActive: true,
      isFeatured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1696446702183-cbd639ab9d0a?w=600', publicId: 'iphone-15-pro-1', isPrimary: true, displayOrder: 0 }],
      createdBy: adminId,
    },
    {
      name: 'Samsung 55" 4K QLED Smart TV',
      slug: 'samsung-55-4k-qled-smart-tv',
      description: '<p>Experience vivid, lifelike colour with Quantum Dot technology. With the Neo QLED and our most powerful processor, Mini LED precision dims and brightens to deliver intense contrast and brilliant colour.</p>',
      brand: 'Samsung',
      categoryId: categoryMap['electronics'],
      basePrice: 89990,
      sellingPrice: 74990,
      gstPercent: 28,
      discountPercent: 17,
      stockQuantity: 12,
      isActive: true,
      isFeatured: false,
      images: [{ url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=600', publicId: 'samsung-tv-1', isPrimary: true, displayOrder: 0 }],
      createdBy: adminId,
    },
    {
      name: 'MacBook Air M2 (8GB RAM, 256GB SSD)',
      slug: 'macbook-air-m2-8gb-256gb',
      description: '<p>The redesigned MacBook Air is super thin, super fast, and built for Apple Silicon. With the M2 chip, a brilliant Liquid Retina display, and up to 18 hours of battery life.</p>',
      brand: 'Apple',
      categoryId: categoryMap['electronics'],
      basePrice: 114900,
      sellingPrice: 109900,
      gstPercent: 18,
      discountPercent: 4,
      stockQuantity: 8,
      isActive: true,
      isFeatured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600', publicId: 'macbook-air-m2-1', isPrimary: true, displayOrder: 0 }],
      createdBy: adminId,
    },
    // Fashion
    {
      name: 'Men\'s Classic Fit Oxford Dress Shirt',
      slug: 'mens-classic-fit-oxford-dress-shirt',
      description: '<p>Premium 100% cotton Oxford weave fabric. Classic fit for a comfortable, relaxed feel. Wrinkle-resistant and easy care. Available in multiple colors.</p>',
      brand: 'NexMart Essentials',
      categoryId: categoryMap['fashion'],
      basePrice: 2499,
      sellingPrice: 1799,
      gstPercent: 12,
      discountPercent: 28,
      stockQuantity: 150,
      isActive: true,
      isFeatured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600', publicId: 'oxford-shirt-1', isPrimary: true, displayOrder: 0 }],
      createdBy: adminId,
    },
    {
      name: 'Women\'s High-Rise Slim Fit Jeans',
      slug: 'womens-high-rise-slim-fit-jeans',
      description: '<p>These ultra-comfortable slim fit jeans feature a high-rise waistband for a flattering silhouette. Made from stretch denim for all-day comfort.</p>',
      brand: 'Levi\'s',
      categoryId: categoryMap['fashion'],
      basePrice: 3999,
      sellingPrice: 2799,
      gstPercent: 12,
      discountPercent: 30,
      stockQuantity: 75,
      isActive: true,
      isFeatured: false,
      images: [{ url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600', publicId: 'womens-jeans-1', isPrimary: true, displayOrder: 0 }],
      createdBy: adminId,
    },
    {
      name: 'Nike Air Max 270 Running Shoes',
      slug: 'nike-air-max-270-running-shoes',
      description: '<p>The Nike Air Max 270 delivers unrivaled, all-day comfort. The heel Air unit offers the most air we\'ve ever put in an Air Max lifestyle shoe for a soft, springy ride.</p>',
      brand: 'Nike',
      categoryId: categoryMap['fashion'],
      basePrice: 12995,
      sellingPrice: 9995,
      gstPercent: 12,
      discountPercent: 23,
      stockQuantity: 60,
      isActive: true,
      isFeatured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', publicId: 'nike-air-max-1', isPrimary: true, displayOrder: 0 }],
      createdBy: adminId,
    },
    // Home & Kitchen
    {
      name: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker',
      slug: 'instant-pot-duo-7-in-1-electric-pressure-cooker',
      description: '<p>7-in-1 multi-cooker: Pressure Cooker, Slow Cooker, Rice Cooker, Steamer, Saute Pan, Yogurt Maker and Food Warmer. 6 quart capacity feeds 4-6 people.</p>',
      brand: 'Instant Pot',
      categoryId: categoryMap['home-kitchen'],
      basePrice: 8499,
      sellingPrice: 6499,
      gstPercent: 18,
      discountPercent: 24,
      stockQuantity: 35,
      isActive: true,
      isFeatured: false,
      images: [{ url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600', publicId: 'instant-pot-1', isPrimary: true, displayOrder: 0 }],
      createdBy: adminId,
    },
    {
      name: 'Philips Air Fryer HD9200 (1400W)',
      slug: 'philips-air-fryer-hd9200-1400w',
      description: '<p>Rapid Air Technology circulates hot air around your food for a crispy layer on the outside and juicy tender results on the inside. Up to 90% less fat than deep frying.</p>',
      brand: 'Philips',
      categoryId: categoryMap['home-kitchen'],
      basePrice: 11995,
      sellingPrice: 8995,
      gstPercent: 18,
      discountPercent: 25,
      stockQuantity: 28,
      isActive: true,
      isFeatured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1648345527286-0a28a7caada8?w=600', publicId: 'philips-airfryer-1', isPrimary: true, displayOrder: 0 }],
      createdBy: adminId,
    },
    // Sports
    {
      name: 'Fitbit Charge 6 Advanced Fitness Tracker',
      slug: 'fitbit-charge-6-advanced-fitness-tracker',
      description: '<p>Get more out of every workout with built-in GPS and top-notch health metrics. Track your heart rate, sleep, stress and more with 40+ exercise modes.</p>',
      brand: 'Fitbit',
      categoryId: categoryMap['sports-fitness'],
      basePrice: 14999,
      sellingPrice: 11999,
      gstPercent: 18,
      discountPercent: 20,
      stockQuantity: 40,
      isActive: true,
      isFeatured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600', publicId: 'fitbit-charge6-1', isPrimary: true, displayOrder: 0 }],
      createdBy: adminId,
    },
    {
      name: 'Yoga Mat Premium Non-Slip 6mm Thick',
      slug: 'yoga-mat-premium-non-slip-6mm',
      description: '<p>Superior grip, dense cushioning, and eco-friendly TPE material. Perfect for yoga, Pilates, stretching, and floor exercises. Includes carrying strap.</p>',
      brand: 'NexMart Sport',
      categoryId: categoryMap['sports-fitness'],
      basePrice: 1999,
      sellingPrice: 1299,
      gstPercent: 18,
      discountPercent: 35,
      stockQuantity: 200,
      isActive: true,
      isFeatured: false,
      images: [{ url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600', publicId: 'yoga-mat-1', isPrimary: true, displayOrder: 0 }],
      createdBy: adminId,
    },
    // Books
    {
      name: 'Atomic Habits by James Clear (Hardcover)',
      slug: 'atomic-habits-james-clear-hardcover',
      description: '<p>No.1 bestselling book from James Clear. Tiny changes, remarkable results. An easy and proven way to build good habits and break bad ones.</p>',
      brand: 'Random House',
      categoryId: categoryMap['books'],
      basePrice: 799,
      sellingPrice: 549,
      gstPercent: 0,
      discountPercent: 31,
      stockQuantity: 300,
      isActive: true,
      isFeatured: false,
      images: [{ url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600', publicId: 'atomic-habits-1', isPrimary: true, displayOrder: 0 }],
      createdBy: adminId,
    },
    // Beauty
    {
      name: 'Neutrogena Hydro Boost Gel Moisturizer',
      slug: 'neutrogena-hydro-boost-gel-moisturizer',
      description: '<p>Hydrating gel moisturizer instantly quenches skin and keeps it looking smooth, supple and hydrated. Contains hyaluronic acid to attract and lock in hydration.</p>',
      brand: 'Neutrogena',
      categoryId: categoryMap['beauty-personal-care'],
      basePrice: 899,
      sellingPrice: 699,
      gstPercent: 18,
      discountPercent: 22,
      stockQuantity: 180,
      isActive: true,
      isFeatured: false,
      images: [{ url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600', publicId: 'neutrogena-hydro-1', isPrimary: true, displayOrder: 0 }],
      createdBy: adminId,
    },
    {
      name: 'Dyson Supersonic Hair Dryer',
      slug: 'dyson-supersonic-hair-dryer',
      description: '<p>Dyson\'s most advanced hair dryer. Engineered to protect hair from extreme heat damage. Fast drying with controlled, high velocity airflow. Includes 5 magnetic attachments.</p>',
      brand: 'Dyson',
      categoryId: categoryMap['beauty-personal-care'],
      basePrice: 37900,
      sellingPrice: 32900,
      gstPercent: 18,
      discountPercent: 13,
      stockQuantity: 15,
      isActive: true,
      isFeatured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=600', publicId: 'dyson-hair-dryer-1', isPrimary: true, displayOrder: 0 }],
      createdBy: adminId,
    },
    // Low stock product for testing alerts
    {
      name: 'Limited Edition Luxury Watch - Rose Gold',
      slug: 'limited-edition-luxury-watch-rose-gold',
      description: '<p>Exquisite rose gold finish with sapphire crystal glass. Swiss movement with 40-hour power reserve. Water resistant to 50m.</p>',
      brand: 'NexMart Prestige',
      categoryId: categoryMap['fashion'],
      basePrice: 25999,
      sellingPrice: 19999,
      gstPercent: 18,
      discountPercent: 23,
      stockQuantity: 3,
      isActive: true,
      isFeatured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600', publicId: 'luxury-watch-1', isPrimary: true, displayOrder: 0 }],
      createdBy: adminId,
    },
  ];

  const insertedProducts: any[] = [];
  for (const p of products) {
    const existing = await Product.findOne({ slug: p.slug });
    if (!existing) {
      const prod = await Product.create(p);
      insertedProducts.push(prod);
    } else {
      insertedProducts.push(existing);
    }
  }
  console.log(`✅ ${insertedProducts.length} Products seeded`);

  // ── 5. Reviews ────────────────────────────────────────────
  const customer = await User.findOne({ email: 'customer@example.com' });
  if (customer) {
    const reviewsData = [
      { productId: insertedProducts[0]._id, rating: 5, title: 'Absolutely amazing sound!', body: 'The noise cancellation is unreal. I wear these on my daily commute and can barely hear anything. Sound quality is top-notch. Battery life is incredible too.' },
      { productId: insertedProducts[1]._id, rating: 5, title: 'Best iPhone ever made', body: 'The titanium frame feels incredibly premium. Camera is insanely good. The Action button is super useful. Worth every rupee.' },
      { productId: insertedProducts[6]._id, rating: 4, title: 'Very comfortable for long runs', body: 'Great cushioning and support. Took a day or two to break in but now they\'re extremely comfortable. Good value for the price.' },
      { productId: insertedProducts[3]._id, rating: 5, title: 'MacBook Air M2 is a game changer', body: 'Absolutely silent, blazing fast, and the battery lasts all day. Best laptop I\'ve ever owned. The display is gorgeous.' },
    ];

    for (const r of reviewsData) {
      const existing = await Review.findOne({ productId: r.productId, userId: customer._id });
      if (!existing) {
        await Review.create({
          ...r,
          userId: customer._id,
          isVerifiedPurchase: true,
          isApproved: true,
        });
      }
    }
    // One pending review
    const pendingProd = insertedProducts[8];
    const existingPending = await Review.findOne({ productId: pendingProd._id, userId: customer._id });
    if (!existingPending) {
      await Review.create({
        productId: pendingProd._id,
        userId: customer._id,
        rating: 4,
        title: 'Great air fryer!',
        body: 'Cooks food evenly and quickly. Easy to clean. My family loves the crispy results without all the oil.',
        isVerifiedPurchase: false,
        isApproved: false,
      });
    }
    console.log('✅ Reviews seeded');
  }

  // ── 6. Coupons ────────────────────────────────────────────
  const coupons = [
    { code: 'WELCOME20', type: 'PERCENTAGE', value: 20, minOrderValue: 500, maxDiscount: 1000, usageLimit: 1000, isActive: true, expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    { code: 'FLAT500', type: 'FLAT', value: 500, minOrderValue: 2000, isActive: true, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    { code: 'SUMMER30', type: 'PERCENTAGE', value: 30, minOrderValue: 1500, maxDiscount: 2000, usageLimit: 500, isActive: true, expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
    { code: 'NEWUSER10', type: 'PERCENTAGE', value: 10, minOrderValue: 0, maxDiscount: 500, usageLimit: 1, isActive: true },
    { code: 'EXPIRED50', type: 'PERCENTAGE', value: 50, minOrderValue: 1000, isActive: true, expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }, // expired
  ];

  for (const c of coupons) {
    await Coupon.findOneAndUpdate({ code: c.code }, c, { upsert: true, new: true });
  }
  console.log('✅ 5 Coupons seeded (including 1 expired for testing)');

  // ── Done ──────────────────────────────────────────────────
  console.log('\n🎉 Full seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin Login: superadmin@store.com / SuperAdmin@123');
  console.log('Customer Login: customer@example.com / Customer@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
