import PGSettings from '../models/PGSettings.js';
import { logActivity } from '../utils/activityLogger.js';
import { handleControllerError } from '../utils/sanitize.js';

// @desc    Get PG Settings
// @route   GET /api/settings
// @access  Private (All roles)
export const getSettings = async (req, res) => {
  try {
    const settings = await PGSettings.getSettings();
    return res.json({ success: true, data: settings });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to fetch PG settings');
  }
};

// @desc    Update PG Settings
// @route   PUT /api/settings
// @access  Private (Admin only)
export const updateSettings = async (req, res) => {
  try {
    const {
      hostelName, address, gateOpeningTime, gateClosingTime,
      visitingHoursStart, visitingHoursEnd, silentHoursStart, silentHoursEnd,
      wifiSsid, wifiDetails, emergencyContacts, generalRules
    } = req.body;
    const settings = await PGSettings.getSettings();
    if (hostelName !== undefined) settings.hostelName = hostelName.trim();
    if (address !== undefined) settings.address = address.trim();
    if (gateOpeningTime !== undefined) settings.gateOpeningTime = gateOpeningTime;
    if (gateClosingTime !== undefined) settings.gateClosingTime = gateClosingTime;
    if (visitingHoursStart !== undefined) settings.visitingHoursStart = visitingHoursStart;
    if (visitingHoursEnd !== undefined) settings.visitingHoursEnd = visitingHoursEnd;
    if (silentHoursStart !== undefined) settings.silentHoursStart = silentHoursStart;
    if (silentHoursEnd !== undefined) settings.silentHoursEnd = silentHoursEnd;
    if (wifiSsid !== undefined) settings.wifiSsid = wifiSsid.trim();
    if (wifiDetails !== undefined) settings.wifiDetails = wifiDetails.trim();
    if (emergencyContacts) {
      settings.emergencyContacts = {
        ambulance: (emergencyContacts.ambulance || '').trim(),
        police: (emergencyContacts.police || '').trim(),
        wardenPhone: (emergencyContacts.wardenPhone || '').trim(),
        nearestHospital: (emergencyContacts.nearestHospital || '').trim()
      };
    }
    if (generalRules && Array.isArray(generalRules)) {
      settings.generalRules = generalRules.filter(r => r && r.trim()).map(r => r.trim());
    }
    await settings.save();
    await logActivity({
      user: req.user,
      action: 'UPDATE_PG_SETTINGS',
      entity: 'PGSettings',
      entityId: settings._id,
      description: 'Admin updated PG settings'
    });
    return res.json({ success: true, message: 'PG settings updated successfully', data: settings });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to update PG settings');
  }
};


