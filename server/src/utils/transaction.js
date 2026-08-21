import mongoose from 'mongoose';

/**
 * Execute a callback within a MongoDB session/transaction.
 * If running on standalone MongoDB where transactions aren't supported,
 * executes callback directly to ensure compatibility across all environments.
 */
export const withTransaction = async (callback) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const result = await callback(session);

    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    // If error is due to standalone MongoDB not supporting transactions, retry without transaction
    if (error.message && error.message.includes('Transactions are not supported by this deployment')) {
      return await callback(null);
    }
    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};
