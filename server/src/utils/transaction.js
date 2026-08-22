import mongoose from 'mongoose';

/**
 * Execute a critical multi-document database operation within a verified MongoDB transaction.
 * 
 * NOTE: MongoDB Multi-Document Transactions require a Replica Set deployment
 * or MongoDB Atlas Cloud instance. Standalone MongoDB instances do not support
 * ACID transactions. For production data integrity, transactions do not silently fallback.
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
    
    // Explicit transaction requirement enforcement
    if (error.message && error.message.includes('Transactions are not supported by this deployment')) {
      const err = new Error(
        'Transaction Failed: MongoDB multi-document transactions require a Replica Set or MongoDB Atlas deployment. ' +
        'Standalone local MongoDB does not support ACID transaction sessions.'
      );
      err.statusCode = 500;
      throw err;
    }

    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};
