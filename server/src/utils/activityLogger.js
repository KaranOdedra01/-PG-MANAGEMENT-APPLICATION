import ActivityLog from '../models/ActivityLog.js';

/**
 * Log an activity to MongoDB for audit trails and dashboard feeds
 * @param {Object} params
 * @param {Object} [params.user] Current authenticated user object
 * @param {string} params.action E.g., 'CREATE', 'UPDATE', 'DELETE', 'CHECKOUT', 'PAYMENT'
 * @param {string} params.entity E.g., 'Tenant', 'Room', 'Invoice', 'Complaint', 'Notice', 'Visitor'
 * @param {string} [params.entityId] ID of the entity
 * @param {string} params.description Human-readable description
 * @param {Object} [params.metadata] Extra contextual details
 */
export const logActivity = async ({ user, action, entity, entityId = '', description, metadata = {} }) => {
  try {
    await ActivityLog.create({
      actor: {
        userId: user?._id || null,
        name: user?.name || 'System',
        role: user?.role || 'system'
      },
      action,
      entity,
      entityId: entityId ? entityId.toString() : '',
      description,
      metadata
    });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};
