/**
 * Test data fixtures for OpenRide E2E tests
 */

export const testUsers = {
  rider: {
    openId: 'test-rider-001',
    name: 'Test Rider',
    email: 'rider@test.com',
    role: 'user' as const,
  },
  driver: {
    openId: 'test-driver-001',
    name: 'Test Driver',
    email: 'driver@test.com',
    role: 'user' as const,
  },
  admin: {
    openId: 'test-admin-001',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'admin' as const,
  },
};

export const testVehicle = {
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  color: 'Silver',
  licensePlate: 'TEST123',
  capacity: 4,
};

export const testRide = {
  pickupAddress: '123 Main St, Toronto, ON',
  pickupLat: '43.6532',
  pickupLng: '-79.3832',
  dropoffAddress: '456 King St, Toronto, ON',
  dropoffLat: '43.6426',
  dropoffLng: '-79.3871',
  distance: 5000, // meters
  estimatedDuration: 900, // seconds (15 min)
  baseFare: 1500, // cents ($15.00)
};

export const testDelivery = {
  pickupAddress: '789 Queen St, Toronto, ON',
  pickupLat: '43.6543',
  pickupLng: '-79.3890',
  dropoffAddress: '321 Bloor St, Toronto, ON',
  dropoffLat: '43.6677',
  dropoffLng: '-79.3948',
  packageSize: 'medium' as const,
  packageWeight: 5,
  specialInstructions: 'Fragile - Handle with care',
  recipientName: 'Jane Doe',
  recipientPhone: '+14165551234',
};

export const testProposal = {
  title: 'Test Proposal: Reduce Network Fee to 12%',
  description: 'This is a test proposal to reduce the network fee from 13% to 12% to increase driver earnings.',
  tier: 2, // Operational
  votingPeriodHours: 72, // 3 days
};

export const testInsuranceClaim = {
  incidentDate: new Date().toISOString(),
  description: 'Minor fender bender at intersection. No injuries.',
  amountRequested: 50000, // cents ($500.00)
  incidentType: 'accident' as const,
};

export const testEmergencyContact = {
  name: 'Emergency Contact',
  phone: '+14165559999',
  email: 'emergency@test.com',
  relationship: 'spouse',
};
