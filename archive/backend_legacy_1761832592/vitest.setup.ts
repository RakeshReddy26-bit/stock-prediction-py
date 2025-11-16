// Ensure test environment
process.env.NODE_ENV = 'test';

// Optionally tweak timeouts for MongoDB binaries on slow CI
process.env.MONGOMS_DEBUG = '0';

// Silence Express rate-limiters by ensuring NODE_ENV=test (server.ts checks this)
// Additional global hooks can be added here if needed.
