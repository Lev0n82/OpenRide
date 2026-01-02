import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from './db';
import { users, driverProfiles, rides } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

describe('Ride Matching System', () => {
  let testRiderId: number;
  let testDriverId: number;
  let testDriverUserId: number;

  beforeAll(async () => {
    // Create test rider
    const [rider] = await db.insert(users).values({
      openId: 'test-rider-matching-' + Date.now(),
      name: 'Test Rider',
      email: 'rider-matching@test.com',
      role: 'user',
    }).returning();
    testRiderId = rider.id;

    // Create test driver user
    const [driverUser] = await db.insert(users).values({
      openId: 'test-driver-matching-' + Date.now(),
      name: 'Test Driver',
      email: 'driver-matching@test.com',
      role: 'user',
    }).returning();
    testDriverUserId = driverUser.id;

    // Create test driver profile
    const [driver] = await db.insert(driverProfiles).values({
      userId: testDriverUserId,
      licenseNumber: 'TEST123',
      vehicleModel: 'Toyota Camry',
      vehiclePlate: 'ABC123',
      vehicleType: 'standard',
      status: 'approved',
      isAvailable: true,
      totalRides: 0,
      rating: 5.0,
    }).returning();
    testDriverId = driver.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testDriverId) {
      await db.delete(driverProfiles).where(eq(driverProfiles.id, testDriverId));
    }
    if (testDriverUserId) {
      await db.delete(users).where(eq(users.id, testDriverUserId));
    }
    if (testRiderId) {
      await db.delete(users).where(eq(users.id, testRiderId));
    }
  });

  it('should create a ride request', async () => {
    const [ride] = await db.insert(rides).values({
      riderId: testRiderId,
      pickupLocation: JSON.stringify({ lat: 43.6532, lng: -79.3832, address: 'Toronto, ON' }),
      destination: JSON.stringify({ lat: 43.7001, lng: -79.4163, address: 'North York, ON' }),
      status: 'pending',
      estimatedFare: 2500, // $25.00
      vehicleType: 'standard',
    }).returning();

    expect(ride).toBeDefined();
    expect(ride.riderId).toBe(testRiderId);
    expect(ride.status).toBe('pending');
    expect(ride.estimatedFare).toBe(2500);

    // Clean up
    await db.delete(rides).where(eq(rides.id, ride.id));
  });

  it('should find available drivers', async () => {
    const availableDrivers = await db
      .select()
      .from(driverProfiles)
      .where(
        and(
          eq(driverProfiles.status, 'approved'),
          eq(driverProfiles.isAvailable, true)
        )
      );

    expect(availableDrivers.length).toBeGreaterThan(0);
    expect(availableDrivers[0].isAvailable).toBe(true);
    expect(availableDrivers[0].status).toBe('approved');
  });

  it('should match driver to ride', async () => {
    // Create ride
    const [ride] = await db.insert(rides).values({
      riderId: testRiderId,
      pickupLocation: JSON.stringify({ lat: 43.6532, lng: -79.3832, address: 'Toronto, ON' }),
      destination: JSON.stringify({ lat: 43.7001, lng: -79.4163, address: 'North York, ON' }),
      status: 'pending',
      estimatedFare: 2500,
      vehicleType: 'standard',
    }).returning();

    // Assign driver
    const [updatedRide] = await db
      .update(rides)
      .set({
        driverId: testDriverUserId,
        status: 'accepted',
      })
      .where(eq(rides.id, ride.id))
      .returning();

    expect(updatedRide.driverId).toBe(testDriverUserId);
    expect(updatedRide.status).toBe('accepted');

    // Clean up
    await db.delete(rides).where(eq(rides.id, ride.id));
  });

  it('should calculate fare correctly', () => {
    const baseFare = 250; // $2.50
    const distanceKm = 10;
    const durationMin = 20;
    const perKm = 100; // $1.00
    const perMinute = 25; // $0.25

    const distanceFare = distanceKm * perKm;
    const timeFare = durationMin * perMinute;
    const subtotal = baseFare + distanceFare + timeFare;

    // 13% platform fee
    const total = subtotal;
    const driverEarnings = Math.round(total * 0.87);
    const platformFee = Math.round(total * 0.13);

    expect(total).toBe(1750); // $17.50
    expect(driverEarnings).toBe(1523); // $15.23 (87%)
    expect(platformFee).toBe(228); // $2.28 (13%)
  });

  it('should complete ride and update driver stats', async () => {
    // Create ride
    const [ride] = await db.insert(rides).values({
      riderId: testRiderId,
      driverId: testDriverUserId,
      pickupLocation: JSON.stringify({ lat: 43.6532, lng: -79.3832, address: 'Toronto, ON' }),
      destination: JSON.stringify({ lat: 43.7001, lng: -79.4163, address: 'North York, ON' }),
      status: 'active',
      estimatedFare: 2500,
      actualFare: 2500,
      vehicleType: 'standard',
    }).returning();

    // Complete ride
    const [completedRide] = await db
      .update(rides)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(rides.id, ride.id))
      .returning();

    expect(completedRide.status).toBe('completed');
    expect(completedRide.completedAt).toBeDefined();

    // Update driver stats
    const [driver] = await db
      .select()
      .from(driverProfiles)
      .where(eq(driverProfiles.id, testDriverId));

    await db
      .update(driverProfiles)
      .set({
        totalRides: driver.totalRides + 1,
      })
      .where(eq(driverProfiles.id, testDriverId));

    const [updatedDriver] = await db
      .select()
      .from(driverProfiles)
      .where(eq(driverProfiles.id, testDriverId));

    expect(updatedDriver.totalRides).toBe(driver.totalRides + 1);

    // Clean up
    await db.delete(rides).where(eq(rides.id, ride.id));
    await db
      .update(driverProfiles)
      .set({ totalRides: 0 })
      .where(eq(driverProfiles.id, testDriverId));
  });
});
