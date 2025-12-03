import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: 'user' | 'admin' = 'user'): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@openride.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    rideTokenBalance: 100,
    phoneNumber: "+1234567890",
    profilePhoto: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("OpenRide Platform Tests", () => {
  describe("Authentication", () => {
    it("should return authenticated user with auth.me", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeDefined();
      expect(result?.email).toBe("test@openride.com");
      expect(result?.rideTokenBalance).toBe(100);
    });

    it("should successfully logout", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();

      expect(result.success).toBe(true);
    });
  });

  describe("Driver Management", () => {
    it("should return null for non-driver user profile", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const profile = await caller.driver.getMyProfile();

      expect(profile).toBeUndefined();
    });
  });

  describe("Ride Management", () => {
    it("should return empty ride history for new user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const rides = await caller.ride.getMyRides();

      expect(rides).toBeDefined();
      expect(rides.asRider).toEqual([]);
      expect(rides.asDriver).toEqual([]);
    });

    it("should return null for no active ride", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const activeRide = await caller.ride.getActive();

      expect(activeRide).toBeNull();
    });
  });

  describe("DAO Governance", () => {
    it("should return active proposals", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const proposals = await caller.governance.getActive();

      expect(proposals).toBeDefined();
      expect(Array.isArray(proposals)).toBe(true);
    });

    it("should return all proposals", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const proposals = await caller.governance.getAll();

      expect(proposals).toBeDefined();
      expect(Array.isArray(proposals)).toBe(true);
    });
  });

  describe("Insurance Pool", () => {
    it("should return insurance pool status", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const pool = await caller.insurance.getPool();

      expect(pool).toBeDefined();
      expect(pool).toHaveProperty('totalReserves');
      expect(pool).toHaveProperty('totalClaims');
      expect(pool).toHaveProperty('totalPaid');
    });

    it("should return user claims", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const claims = await caller.insurance.getMyClaims();

      expect(claims).toBeDefined();
      expect(Array.isArray(claims)).toBe(true);
    });
  });

  describe("Token Economics", () => {
    it("should return user token balance and transactions", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const tokenData = await caller.tokens.getMyTokens();

      expect(tokenData).toBeDefined();
      expect(tokenData.balance).toBe(100);
      expect(Array.isArray(tokenData.transactions)).toBe(true);
    });

    it("should return buyback history", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const history = await caller.tokens.getBuybackHistory();

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("Safety Features", () => {
    it("should return user emergency contacts", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const contacts = await caller.safety.getMyContacts();

      expect(contacts).toBeDefined();
      expect(Array.isArray(contacts)).toBe(true);
    });
  });

  describe("Admin Features", () => {
    it("should return pending driver verifications for admin", async () => {
      const ctx = createAuthContext('admin');
      const caller = appRouter.createCaller(ctx);

      const pending = await caller.driver.getPendingVerifications();

      expect(pending).toBeDefined();
      expect(Array.isArray(pending)).toBe(true);
    });

    it("should return pending claims for admin", async () => {
      const ctx = createAuthContext('admin');
      const caller = appRouter.createCaller(ctx);

      const claims = await caller.insurance.getPending();

      expect(claims).toBeDefined();
      expect(Array.isArray(claims)).toBe(true);
    });

    it("should deny non-admin access to pending verifications", async () => {
      const ctx = createAuthContext('user');
      const caller = appRouter.createCaller(ctx);

      await expect(caller.driver.getPendingVerifications()).rejects.toThrow();
    });
  });
});
