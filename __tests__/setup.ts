// Jest setup file for test configuration
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error and error for debugging
  error: console.error,
};

// Increase Jest timeout for database operations
jest.setTimeout(10000);

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.NEXTAUTH_SECRET = "test-secret-key-for-testing-only";
