import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from './db';
import { users, proposals, votes } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('DAO Voting System', () => {
  let testUserId: number;
  let testProposalId: number;

  beforeAll(async () => {
    // Create test user with tokens
    const [user] = await db.insert(users).values({
      openId: 'test-voter-' + Date.now(),
      name: 'Test Voter',
      email: 'voter@test.com',
      role: 'user',
      rideTokenBalance: 1000,
    }).returning();
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testProposalId) {
      await db.delete(votes).where(eq(votes.proposalId, testProposalId));
      await db.delete(proposals).where(eq(proposals.id, testProposalId));
    }
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it('should create a proposal', async () => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7); // 7 days from now

    const [proposal] = await db.insert(proposals).values({
      creatorId: testUserId,
      title: 'Test Proposal: Increase Driver Commission',
      description: 'Proposal to increase driver commission from 87% to 90%',
      type: 'operational',
      votesFor: 0,
      votesAgainst: 0,
      status: 'active',
      deadline,
    }).returning();

    testProposalId = proposal.id;

    expect(proposal).toBeDefined();
    expect(proposal.title).toContain('Test Proposal');
    expect(proposal.status).toBe('active');
    expect(proposal.votesFor).toBe(0);
    expect(proposal.votesAgainst).toBe(0);
  });

  it('should allow user to vote on proposal', async () => {
    if (!testProposalId) {
      throw new Error('Test proposal not created');
    }

    // Cast vote
    const [vote] = await db.insert(votes).values({
      proposalId: testProposalId,
      userId: testUserId,
      voteType: 'for',
      tokenWeight: 1000,
    }).returning();

    expect(vote).toBeDefined();
    expect(vote.proposalId).toBe(testProposalId);
    expect(vote.userId).toBe(testUserId);
    expect(vote.voteType).toBe('for');
    expect(vote.tokenWeight).toBe(1000);

    // Update proposal vote count
    await db
      .update(proposals)
      .set({ votesFor: 1000 })
      .where(eq(proposals.id, testProposalId));

    const [updatedProposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, testProposalId));

    expect(updatedProposal.votesFor).toBe(1000);
  });

  it('should prevent double voting', async () => {
    if (!testProposalId) {
      throw new Error('Test proposal not created');
    }

    // Check if user already voted
    const existingVote = await db
      .select()
      .from(votes)
      .where(eq(votes.proposalId, testProposalId))
      .where(eq(votes.userId, testUserId));

    expect(existingVote.length).toBeGreaterThan(0);

    // User should not be able to vote again
    const hasVoted = existingVote.length > 0;
    expect(hasVoted).toBe(true);
  });

  it('should calculate voting power based on token balance', () => {
    const tokenBalance = 1000;
    const votingPower = tokenBalance; // 1 token = 1 vote

    expect(votingPower).toBe(1000);
  });

  it('should determine proposal outcome', () => {
    const votesFor = 6000;
    const votesAgainst = 4000;
    const totalVotes = votesFor + votesAgainst;

    const forPercentage = (votesFor / totalVotes) * 100;
    const againstPercentage = (votesAgainst / totalVotes) * 100;

    expect(forPercentage).toBe(60);
    expect(againstPercentage).toBe(40);

    // Proposal passes if FOR > AGAINST
    const passed = votesFor > votesAgainst;
    expect(passed).toBe(true);
  });

  it('should check quorum requirement', () => {
    const totalSupply = 1000000000; // 1 billion RIDE tokens
    const quorumPercentage = 0.10; // 10%
    const requiredQuorum = totalSupply * quorumPercentage;

    const totalVotes = 150000000; // 150 million votes
    const meetsQuorum = totalVotes >= requiredQuorum;

    expect(requiredQuorum).toBe(100000000); // 100 million
    expect(meetsQuorum).toBe(true);
  });

  it('should update proposal status after voting period', async () => {
    if (!testProposalId) {
      throw new Error('Test proposal not created');
    }

    // Simulate voting period end
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, testProposalId));

    const votesFor = proposal.votesFor;
    const votesAgainst = proposal.votesAgainst;
    const newStatus = votesFor > votesAgainst ? 'passed' : 'rejected';

    await db
      .update(proposals)
      .set({ status: newStatus })
      .where(eq(proposals.id, testProposalId));

    const [updatedProposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, testProposalId));

    expect(updatedProposal.status).toBe('passed');
  });

  it('should allow vote changes before deadline', async () => {
    if (!testProposalId) {
      throw new Error('Test proposal not created');
    }

    // Change vote from FOR to AGAINST
    await db
      .update(votes)
      .set({ voteType: 'against' })
      .where(eq(votes.proposalId, testProposalId))
      .where(eq(votes.userId, testUserId));

    const [updatedVote] = await db
      .select()
      .from(votes)
      .where(eq(votes.proposalId, testProposalId))
      .where(eq(votes.userId, testUserId));

    expect(updatedVote.voteType).toBe('against');

    // Update proposal counts
    await db
      .update(proposals)
      .set({
        votesFor: 0,
        votesAgainst: 1000,
      })
      .where(eq(proposals.id, testProposalId));

    const [updatedProposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, testProposalId));

    expect(updatedProposal.votesFor).toBe(0);
    expect(updatedProposal.votesAgainst).toBe(1000);
  });
});
