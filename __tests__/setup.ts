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

// Set test environment variables (use Object.defineProperty for NODE_ENV which is readonly)
Object.defineProperty(process.env, "NODE_ENV", { value: "test", writable: true });
process.env.NEXTAUTH_SECRET = "test-secret-key-for-testing-only";
