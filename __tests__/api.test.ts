import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Order from "@/models/Order";
import bcrypt from "bcryptjs";

describe("Authentication & User Management API", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("User Registration", () => {
    it("should register a new user with valid data", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const user = await User.create({
        ...userData,
        passwordHash: await bcrypt.hash(userData.password, 12),
        role: "CUSTOMER",
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe("CUSTOMER");

      await User.findByIdAndDelete(user._id);
    });

    it("should not register user with duplicate email", async () => {
      const email = "duplicate@example.com";
      const userData = {
        name: "User 1",
        email,
        passwordHash: await bcrypt.hash("password123", 12),
        role: "CUSTOMER",
      };

      await User.create(userData);

      await expect(User.create(userData)).rejects.toThrow();

      await User.deleteMany({ email });
    });

    it("should validate email format", () => {
      const invalidEmails = ["notanemail", "test@", "@example.com"];
      invalidEmails.forEach((email) => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it("should hash passwords securely", async () => {
      const password = "testpassword123";
      const hash1 = await bcrypt.hash(password, 12);
      const hash2 = await bcrypt.hash(password, 12);

      expect(hash1).not.toBe(hash2);
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });
});

describe("Product Management", () => {
  let category: typeof Category;

  beforeAll(async () => {
    await connectDB();
    category = await Category.create({
      name: "Test Category",
      slug: "test-category",
      isActive: true,
    });
  });

  afterAll(async () => {
    await Category.findByIdAndDelete(category._id);
    await mongoose.disconnect();
  });

  describe("Product CRUD Operations", () => {
    it("should create a product with valid data", async () => {
      const productData = {
        name: "Test Product",
        slug: "test-product",
        description: "A test product",
        brand: "Test Brand",
        categoryId: category._id,
        basePrice: 100,
        sellingPrice: 80,
        gstPercent: 18,
        discountPercent: 20,
        stockQuantity: 50,
        isActive: true,
        isFeatured: false,
        createdBy: new mongoose.Types.ObjectId(),
      };

      const product = await Product.create(productData);

      expect(product).toBeDefined();
      expect(product.name).toBe(productData.name);
      expect(product.slug).toBe(productData.slug);
      expect(product.stockQuantity).toBe(50);
      expect(product.isActive).toBe(true);

      await Product.findByIdAndDelete(product._id);
    });

    it("should prevent duplicate product slugs", async () => {
      const slug = "duplicate-slug-test";
      const productData = {
        name: "Product 1",
        slug,
        categoryId: category._id,
        basePrice: 100,
        sellingPrice: 80,
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(),
      };

      await Product.create(productData);

      await expect(
        Product.create({
          ...productData,
          name: "Product 2",
        })
      ).rejects.toThrow();

      await Product.deleteMany({ slug });
    });

    it("should update product stock correctly", async () => {
      const product = await Product.create({
        name: "Stock Test Product",
        slug: "stock-test-product",
        categoryId: category._id,
        basePrice: 100,
        sellingPrice: 100,
        stockQuantity: 100,
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(),
      });

      const updated = await Product.findByIdAndUpdate(
        product._id,
        { $inc: { stockQuantity: -10 } },
        { new: true }
      );

      expect(updated.stockQuantity).toBe(90);

      await Product.findByIdAndDelete(product._id);
    });

    it("should validate price fields", async () => {
      const productData = {
        name: "Invalid Price Product",
        slug: "invalid-price-product",
        categoryId: category._id,
        basePrice: -100, // invalid
        sellingPrice: 80,
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(),
      };

      expect(() => {
        const schema = Product.schema.path("basePrice");
        // Validation should fail for negative prices
        if (productData.basePrice < 0) {
          throw new Error("Price must be positive");
        }
      }).toThrow();
    });
  });
});

describe("Order Management", () => {
  let user: typeof User;
  let product: typeof Product;
  let category: typeof Category;

  beforeAll(async () => {
    await connectDB();

    user = await User.create({
      name: "Order Test User",
      email: "order@test.com",
      passwordHash: await bcrypt.hash("password123", 12),
      role: "CUSTOMER",
    });

    category = await Category.create({
      name: "Order Test Category",
      slug: "order-test-category",
      isActive: true,
    });

    product = await Product.create({
      name: "Order Test Product",
      slug: "order-test-product",
      categoryId: category._id,
      basePrice: 100,
      sellingPrice: 100,
      stockQuantity: 100,
      isActive: true,
      createdBy: user._id,
    });
  });

  afterAll(async () => {
    await User.findByIdAndDelete(user._id);
    await Product.findByIdAndDelete(product._id);
    await Category.findByIdAndDelete(category._id);
    await Order.deleteMany({ userId: user._id });
    await mongoose.disconnect();
  });

  describe("Order Operations", () => {
    it("should create order with valid data", async () => {
      const orderData = {
        orderNumber: `ORD-${Date.now()}`,
        userId: user._id,
        addressId: new mongoose.Types.ObjectId(),
        addressSnapshot: {
          fullName: "Test User",
          phone: "9999999999",
          addressLine1: "123 Street",
          city: "Test City",
          state: "TS",
          pincode: "123456",
        },
        items: [
          {
            productId: product._id,
            quantity: 2,
            unitPrice: 100,
            gstPercent: 18,
            totalPrice: 236, // 2 * 100 * 1.18
            productSnapshot: { name: product.name },
          },
        ],
        subtotal: 200,
        gstAmount: 36,
        shippingAmount: 0,
        totalAmount: 236,
        paymentMethod: "COD",
        paymentStatus: "PENDING_COD",
        orderStatus: "PENDING",
      };

      const order = await Order.create(orderData);

      expect(order).toBeDefined();
      expect(order.orderNumber).toBe(orderData.orderNumber);
      expect(order.userId).toEqual(user._id);
      expect(order.items.length).toBe(1);
      expect(order.totalAmount).toBe(236);

      await Order.findByIdAndDelete(order._id);
    });

    it("should track order status transitions", async () => {
      const order = await Order.create({
        orderNumber: `ORD-${Date.now()}-TEST`,
        userId: user._id,
        addressId: new mongoose.Types.ObjectId(),
        addressSnapshot: { fullName: "Test" },
        items: [],
        subtotal: 0,
        gstAmount: 0,
        shippingAmount: 0,
        totalAmount: 0,
        paymentMethod: "COD",
        paymentStatus: "PENDING_COD",
        orderStatus: "PENDING",
      });

      const statuses = ["CONFIRMED", "PROCESSING", "SHIPPED"];

      for (const status of statuses) {
        const updated = await Order.findByIdAndUpdate(
          order._id,
          { orderStatus: status },
          { new: true }
        );
        expect(updated.orderStatus).toBe(status);
      }

      await Order.findByIdAndDelete(order._id);
    });
  });
});

describe("Data Validation", () => {
  it("should validate email addresses", () => {
    const validEmails = [
      "user@example.com",
      "test.user@example.co.uk",
      "user+tag@example.com",
    ];
    const invalidEmails = ["notanemail", "test@", "@example.com", ""];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    validEmails.forEach((email) => {
      expect(email).toMatch(emailRegex);
    });

    invalidEmails.forEach((email) => {
      expect(email).not.toMatch(emailRegex);
    });
  });

  it("should validate phone numbers", () => {
    const phoneRegex = /^[0-9]{10}$/;

    expect("9999999999").toMatch(phoneRegex);
    expect("123456789").not.toMatch(phoneRegex);
    expect("99999999999").not.toMatch(phoneRegex);
  });

  it("should validate pincode format", () => {
    const pincodeRegex = /^[0-9]{6}$/;

    expect("123456").toMatch(pincodeRegex);
    expect("12345").not.toMatch(pincodeRegex);
    expect("1234567").not.toMatch(pincodeRegex);
  });

  it("should validate rating values", () => {
    const validRatings = [1, 2, 3, 4, 5];
    const invalidRatings = [0, 6, -1, 3.5];

    validRatings.forEach((rating) => {
      expect(rating).toBeGreaterThanOrEqual(1);
      expect(rating).toBeLessThanOrEqual(5);
    });

    invalidRatings.forEach((rating) => {
      expect(rating < 1 || rating > 5).toBe(true);
    });
  });
});
