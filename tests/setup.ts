// tests/setup.ts
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env file
config({ path: path.resolve(__dirname, '../.env.test') });

// Additional setup if needed
beforeEach(() => {
  // Runs before each test
});

afterEach(() => {
  // Runs after each test
});