import mongoose from 'mongoose';

const pgSettingsSchema = new mongoose.Schema({
  hostelName: {
    type: String,
    default: 'Greenwood Executive PG & Hostel',
    trim: true
  },
  address: {
    type: String,
    default: 'Near Infocity, Gandhinagar, Gujarat',
    trim: true
  },
  gateOpeningTime: {
    type: String,
    default: '06:00 AM'
  },
  gateClosingTime: {
    type: String,
    default: '10:30 PM'
  },
  visitingHoursStart: {
    type: String,
    default: '10:00 AM'
  },
  visitingHoursEnd: {
    type: String,
    default: '08:00 PM'
  },
  silentHoursStart: {
    type: String,
    default: '11:00 PM'
  },
  silentHoursEnd: {
    type: String,
    default: '06:00 AM'
  },
  wifiSsid: {
    type: String,
    default: 'PG_HighSpeed_Fiber'
  },
  wifiDetails: {
    type: String,
    default: '200 Mbps High Speed Fiber Network. Password is provided at reception upon physical verification.'
  },
  emergencyContacts: {
    ambulance: { type: String, default: '108' },
    police: { type: String, default: '112' },
    wardenPhone: { type: String, default: '+91 98765 43210' },
    nearestHospital: { type: String, default: 'Apollo Hospital (1.5 km)' }
  },
  generalRules: {
    type: [String],
    default: [
      'Main gate closes strictly at 10:30 PM.',
      'Visitors must register at the security gate and leave before 08:00 PM.',
      'Smoking, alcohol, and illegal substances are strictly prohibited.',
      'Maintain silence in corridors during silent hours (11:00 PM - 06:00 AM).',
      'Report any maintenance issues via the Complaints section immediately.'
    ]
  }
}, { timestamps: true });

// Helper to ensure singleton settings document
pgSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export default mongoose.models.PGSettings || mongoose.model('PGSettings', pgSettingsSchema);
