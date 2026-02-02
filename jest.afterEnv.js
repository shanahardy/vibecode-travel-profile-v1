/**
 * Jest After Environment Setup
 * Runs after Jest framework initializes but before tests run
 * Use for test environment configuration and console suppression
 */

// Store original console methods
const originalError = console.error;
const originalLog = console.log;
const originalWarn = console.warn;
const originalDebug = console.debug;

// Suppress console.error except for actual test failures
console.error = jest.fn((...args) => {
  const message = args.join(' ');
  // Only show actual test failures
  if (message.includes('FAIL') || message.includes('●')) {
    originalError(...args);
  }
  // This reduces noise from expected error messages in error-handling tests
});

// Suppress console.log during tests
console.log = jest.fn((...args) => {
  // Uncomment to see logs during debugging
  // originalLog(...args);
});

// Suppress console.warn during tests
console.warn = jest.fn();

// Suppress console.debug during tests
console.debug = jest.fn();
