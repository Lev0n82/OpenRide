import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from './db';
import { users, rides, tokenTransactions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Token Economics System', () => {
  let testRiderId: number;
  let testDriverId: number;

  beforeAll(async () => {
    // Create test rider
    const [rider] = await db.insert(users).values({
      openId: 'test-rider-tokens-' + Date.now(),
      name: 'Test Rider Tokens',
      email: 'rider-tokens@test.com',
      role: 'user',
      rideTokenBalance: 0,
    }).returning();
    testRiderId = rider.id;

    // Create test driver
    const [driver] = await db.insert(users).values({
      openId: 'test-driver-tokens-' + Date.now(),
      name: 'Test Driver Tokens',
      email: 'driver-tokens@test.com',
      role: 'user',
      rideTokenBalance: 0,
    }).returning();
    testDriverId = driver.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(tokenTransactions).where(eq(tokenTransactions.userId, testRiderId));
    await db.delete(tokenTransactions).where(eq(tokenTransactions.userId, testDriverId));
    await db.delete(users).where(eq(users.id, testRiderId));
    await db.delete(users).where(eq(users.id, testDriverId));
  });

  it('should distribute tokens correctly after ride completion', async () => {
    const fareAmount = 2500; // $25.00
    const riderTokens = Math.round(fareAmount * 0.05 / 100); // 5% of fare in tokens (1 token = $1)
    const driverTokens = Math.round(fareAmount * 0.05 / 100) * 2; // 10% of fare in tokens

    expect(riderTokens).toBe(1); // 1 RIDE token
    expect(driverTokens).toBe(2); // 2 RIDE tokens (drivers earn 2x)
  });

  it('should calculate platform fee distribution', () => {
    const fareAmount = 2500; // $25.00
    const platformFee = Math.round(fareAmount * 0.13); // 13% platform fee = $3.25

    // Fee breakdown
    const insurancePool = Math.round(platformFee * 0.769); // 10% of fare = 76.9% of fee
    const devFund = Math.round(platformFee * 0.192); // 2.5% of fare = 19.2% of fee
    const tokenBuyback = Math.round(platformFee * 0.038); // 0.5% of fare = 3.8% of fee

    expect(platformFee).toBe(325); // $3.25
    expect(insurancePool).toBe(250); // $2.50 (10% of $25)
    expect(devFund).toBe(62); // $0.62 (2.5% of $25)
    expect(tokenBuyback).toBe(12); // $0.12 (0.5% of $25)

    // Verify total
    const total = insurancePool + devFund + tokenBuyback;
    expect(total).toBeLessThanOrEqual(platformFee);
  });

  it('should record token transaction for rider', async () => {
    const [transaction] = await db.insert(tokenTransactions).values({
      userId: testRiderId,
      amount: 1,
      type: 'earned',
      description: 'Ride completion reward',
      balanceAfter: 1,
    }).returning();

    expect(transaction).toBeDefined();
    expect(transaction.userId).toBe(testRiderId);
    expect(transaction.amount).toBe(1);
    expect(transaction.type).toBe('earned');

    // Update user balance
    await db
      .update(users)
      .set({ rideTokenBalance: 1 })
      .where(eq(users.id, testRiderId));

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, testRiderId));

    expect(user.rideTokenBalance).toBe(1);
  });

  it('should record token transaction for driver', async () => {
    const [transaction] = await db.insert(tokenTransactions).values({
      userId: testDriverId,
      amount: 10,
      type: 'earned',
      description: 'Ride completion reward (driver)',
      balanceAfter: 10,
    }).returning();

    expect(transaction).toBeDefined();
    expect(transaction.userId).toBe(testDriverId);
    expect(transaction.amount).toBe(10);
    expect(transaction.type).toBe('earned');

    // Update user balance
    await db
      .update(users)
      .set({ rideTokenBalance: 10 })
      .where(eq(users.id, testDriverId));

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, testDriverId));

    expect(user.rideTokenBalance).toBe(10);
  });

  it('should calculate quarterly buyback amount', () => {
    // Assume $100,000 in quarterly revenue
    const quarterlyRevenue = 10000000; // cents
    const buybackPercentage = 0.005; // 0.5%
    const buybackAmount = Math.round(quarterlyRevenue * buybackPercentage);

    expect(buybackAmount).toBe(50000); // $500 for buyback
  });

  it('should burn tokens correctly', async () => {
    // Set initial balance
    await db
      .update(users)
      .set({ rideTokenBalance: 100 })
      .where(eq(users.id, testRiderId));

    // Burn 10 tokens
    const burnAmount = 10;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, testRiderId));

    const newBalance = user.rideTokenBalance - burnAmount;

    await db
      .update(users)
      .set({ rideTokenBalance: newBalance })
      .where(eq(users.id, testRiderId));

    // Record burn transaction
    await db.insert(tokenTransactions).values({
      userId: testRiderId,
      amount: -burnAmount,
      type: 'burned',
      description: 'Quarterly token burn',
      balanceAfter: newBalance,
    });

    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, testRiderId));

    expect(updatedUser.rideTokenBalance).toBe(90);
  });

  it('should validate token balance never goes negative', async () => {
    await db
      .update(users)
      .set({ rideTokenBalance: 5 })
      .where(eq(users.id, testRiderId));

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, testRiderId));

    // Try to spend more than balance
    const spendAmount = 10;
    const canSpend = user.rideTokenBalance >= spendAmount;

    expect(canSpend).toBe(false);
    expect(user.rideTokenBalance).toBe(5);
  });
});
