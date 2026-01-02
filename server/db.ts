import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  driverProfiles,
  vehicles,
  rides,
  ratings,
  proposals,
  votes,
  claims,
  insurancePool,
  tokenTransactions,
  buybackHistory,
  emergencyContacts,
  safetyIncidents,
  type DriverProfile,
  type InsertDriverProfile,
  type Vehicle,
  type InsertVehicle,
  type Ride,
  type InsertRide,
  type Proposal,
  type InsertProposal,
  type Vote,
  type InsertVote,
  type Claim,
  type InsertClaim,
  type TokenTransaction,
  type InsertTokenTransaction,
  type BuybackHistory,
  type InsertBuybackHistory,
  type InsertEmergencyContact,
  type InsertSafetyIncident,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phoneNumber", "profilePhoto"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserTokenBalance(userId: number, amount: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(users)
    .set({ rideTokenBalance: sql`${users.rideTokenBalance} + ${amount}` })
    .where(eq(users.id, userId));
}

// ============================================================================
// DRIVER PROFILES
// ============================================================================

export async function createDriverProfile(profile: InsertDriverProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(driverProfiles).values(profile) as any;
  return Number(result.insertId);
}

export async function getDriverProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(driverProfiles).where(eq(driverProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDriverProfileById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(driverProfiles).where(eq(driverProfiles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateDriverProfile(id: number, updates: Partial<DriverProfile>) {
  const db = await getDb();
  if (!db) return;

  await db.update(driverProfiles).set(updates).where(eq(driverProfiles.id, id));
}

export async function getPendingDriverVerifications() {
  const db = await getDb();
  if (!db) return [];

  return await db.select({
    driver: driverProfiles,
    user: users,
  })
  .from(driverProfiles)
  .leftJoin(users, eq(driverProfiles.userId, users.id))
  .where(eq(driverProfiles.verificationStatus, "pending"));
}

export async function updateDriverAvailability(driverId: number, isAvailable: boolean) {
  const db = await getDb();
  if (!db) return;

  await db.update(driverProfiles).set({ isAvailable }).where(eq(driverProfiles.id, driverId));
}

// ============================================================================
// VEHICLES
// ============================================================================

export async function createVehicle(vehicle: InsertVehicle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vehicles).values(vehicle) as any;
  return Number(result.insertId);
}

export async function getVehiclesByDriverId(driverId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(vehicles).where(eq(vehicles.driverId, driverId));
}

export async function getActiveVehicleByDriverId(driverId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(vehicles)
    .where(and(eq(vehicles.driverId, driverId), eq(vehicles.isActive, true)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// RIDES
// ============================================================================

export async function createRide(ride: InsertRide) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(rides).values(ride) as any;
  return Number(result.insertId);
}

export async function getRideById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(rides).where(eq(rides.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateRide(id: number, updates: Partial<Ride>) {
  const db = await getDb();
  if (!db) return;

  await db.update(rides).set(updates).where(eq(rides.id, id));
}

export async function getAvailableRides() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(rides)
    .where(eq(rides.status, "requested"))
    .orderBy(desc(rides.requestedAt));
}

export async function getRidesByRiderId(riderId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(rides)
    .where(eq(rides.riderId, riderId))
    .orderBy(desc(rides.requestedAt));
}

export async function getRidesByDriverId(driverId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(rides)
    .where(eq(rides.driverId, driverId))
    .orderBy(desc(rides.requestedAt));
}

export async function getActiveRideByDriverId(driverId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(rides)
    .where(and(
      eq(rides.driverId, driverId),
      sql`${rides.status} IN ('accepted', 'driver_arriving', 'in_progress')`
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getActiveRideByRiderId(riderId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(rides)
    .where(and(
      eq(rides.riderId, riderId),
      sql`${rides.status} IN ('requested', 'accepted', 'driver_arriving', 'in_progress')`
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// RATINGS
// ============================================================================

export async function createRating(rating: typeof ratings.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(ratings).values(rating);
}

export async function getRatingsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(ratings).where(eq(ratings.ratedId, userId));
}

// ============================================================================
// DAO GOVERNANCE
// ============================================================================

export async function createProposal(proposal: InsertProposal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(proposals).values(proposal) as any;
  return Number(result.insertId);
}

export async function getProposalById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getActiveProposals() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(proposals)
    .where(eq(proposals.status, "active"))
    .orderBy(desc(proposals.createdAt));
}

export async function getAllProposals() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(proposals).orderBy(desc(proposals.createdAt));
}

export async function updateProposal(id: number, updates: Partial<Proposal>) {
  const db = await getDb();
  if (!db) return;

  await db.update(proposals).set(updates).where(eq(proposals.id, id));
}

export async function createVote(vote: InsertVote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(votes).values(vote);
}

export async function getVotesByProposalId(proposalId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(votes).where(eq(votes.proposalId, proposalId));
}

export async function getUserVoteForProposal(proposalId: number, voterId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(votes)
    .where(and(eq(votes.proposalId, proposalId), eq(votes.voterId, voterId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// INSURANCE & CLAIMS
// ============================================================================

export async function getInsurancePool() {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(insurancePool).limit(1);
  if (result.length === 0) {
    // Initialize if doesn't exist
    await db.insert(insurancePool).values({
      totalReserves: 0,
      totalClaims: 0,
      totalPaid: 0,
    });
    return { id: 1, totalReserves: 0, totalClaims: 0, totalPaid: 0, updatedAt: new Date() };
  }
  return result[0];
}

export async function updateInsurancePool(reserves: number, claims: number, paid: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(insurancePool)
    .set({
      totalReserves: sql`${insurancePool.totalReserves} + ${reserves}`,
      totalClaims: sql`${insurancePool.totalClaims} + ${claims}`,
      totalPaid: sql`${insurancePool.totalPaid} + ${paid}`,
    })
    .where(eq(insurancePool.id, 1));
}

export async function createClaim(claim: InsertClaim) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(claims).values(claim) as any;
  return Number(result.insertId);
}

export async function getClaimById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(claims).where(eq(claims.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getClaimsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(claims)
    .where(eq(claims.claimantId, userId))
    .orderBy(desc(claims.createdAt));
}

export async function getPendingClaims() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(claims)
    .where(sql`${claims.status} IN ('pending', 'under_review')`)
    .orderBy(desc(claims.createdAt));
}

export async function updateClaim(id: number, updates: Partial<Claim>) {
  const db = await getDb();
  if (!db) return;

  await db.update(claims).set(updates).where(eq(claims.id, id));
}

// ============================================================================
// TOKEN ECONOMICS
// ============================================================================

export async function createTokenTransaction(transaction: InsertTokenTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(tokenTransactions).values(transaction);
}

export async function getTokenTransactionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(tokenTransactions)
    .where(eq(tokenTransactions.userId, userId))
    .orderBy(desc(tokenTransactions.createdAt));
}

export async function createBuybackRecord(buyback: InsertBuybackHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(buybackHistory).values(buyback);
}

export async function getBuybackHistory() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(buybackHistory).orderBy(desc(buybackHistory.executedAt));
}

// ============================================================================
// SAFETY
// ============================================================================

export async function createEmergencyContact(contact: InsertEmergencyContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(emergencyContacts).values(contact);
}

export async function getEmergencyContactsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(emergencyContacts).where(eq(emergencyContacts.userId, userId));
}

export async function createSafetyIncident(incident: InsertSafetyIncident) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(safetyIncidents).values(incident) as any;
  return Number(result.insertId);
}

export async function getSafetyIncidentsByRideId(rideId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(safetyIncidents).where(eq(safetyIncidents.rideId, rideId));
}

export async function getAllSafetyIncidents() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(safetyIncidents).orderBy(desc(safetyIncidents.createdAt));
}
