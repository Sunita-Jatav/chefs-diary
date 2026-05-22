// config/db.js — MongoDB connection manager for Chef's Diary
//
// WHY wrap mongoose.connect() in a function instead of calling it directly?
// This lets server.js control WHEN the connection happens. We want to
// confirm the DB is live before the HTTP server starts accepting requests.
// A server that accepts traffic but can't read/write data is worse than
// one that hasn't started yet.

import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // serverSelectionTimeoutMS: how long Mongoose waits to find
      // a working MongoDB server before throwing an error.
      // 5 seconds is enough to catch misconfigured Atlas URIs quickly.
      serverSelectionTimeoutMS: 5000,

      // socketTimeoutMS: how long to wait on a slow query before
      // closing the socket. 45 seconds covers even heavy aggregations.
      socketTimeoutMS: 45000,
    });

    console.log('');
    console.log(`  ✅  MongoDB connected`);
    console.log(`  📦  Host:     ${conn.connection.host}`);
    console.log(`  📦  Database: ${conn.connection.name}`);
    console.log('');

    // ── Event listeners for runtime diagnostics ──────────────────────
    // These fire AFTER the initial connection, so they don't affect startup.

    mongoose.connection.on('disconnected', () => {
      // Atlas will periodically disconnect idle connections.
      // Mongoose automatically reconnects — this log helps you spot it.
      console.warn('  ⚠️   MongoDB disconnected. Mongoose will auto-reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('  ✅  MongoDB reconnected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      // Runtime errors (network blips, auth expiry) land here.
      console.error('  ❌  MongoDB runtime error:', err.message);
    });

    // ── Graceful shutdown ─────────────────────────────────────────────
    // When Render restarts the service (deploy, crash) or you Ctrl+C
    // locally, this cleanly closes the connection instead of letting
    // MongoDB Atlas count it as an abrupt disconnect.
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('\n  MongoDB connection closed — process terminated cleanly.\n');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error(`  ❌  MongoDB initial connection failed: ${error.message}`);
    console.error('  👉  Check that MONGO_URI in your .env is correct.');
    console.error('  👉  Check that your Atlas cluster is running and IP is whitelisted.');

    // process.exit(1) = exit with error code.
    // We MUST exit here — a server that starts without a database
    // will produce cascading errors on every single request.
    process.exit(1);
  }
};