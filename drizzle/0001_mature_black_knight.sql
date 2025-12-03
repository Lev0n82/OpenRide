CREATE TABLE `buybackHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quarterYear` varchar(10) NOT NULL,
	`fundsAllocated` int NOT NULL,
	`tokensBurned` int NOT NULL,
	`averagePrice` int NOT NULL,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `buybackHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rideId` int NOT NULL,
	`claimantId` int NOT NULL,
	`claimType` enum('accident','damage','injury','theft','other') NOT NULL,
	`description` text NOT NULL,
	`amountRequested` int NOT NULL,
	`amountApproved` int,
	`status` enum('pending','under_review','approved','rejected','paid') NOT NULL DEFAULT 'pending',
	`evidenceUrls` text,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`paidAt` timestamp,
	CONSTRAINT `claims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `driverProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`licenseNumber` varchar(50),
	`licenseExpiry` timestamp,
	`licenseDocumentUrl` text,
	`insuranceDocumentUrl` text,
	`vehicleRegistrationUrl` text,
	`piNetworkKycVerified` boolean NOT NULL DEFAULT false,
	`verificationStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`verificationNotes` text,
	`isAvailable` boolean NOT NULL DEFAULT false,
	`totalRides` int NOT NULL DEFAULT 0,
	`averageRating` int NOT NULL DEFAULT 0,
	`totalEarnings` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `driverProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emergencyContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contactName` varchar(100) NOT NULL,
	`contactPhone` varchar(20) NOT NULL,
	`relationship` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emergencyContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insurancePool` (
	`id` int AUTO_INCREMENT NOT NULL,
	`totalReserves` int NOT NULL DEFAULT 0,
	`totalClaims` int NOT NULL DEFAULT 0,
	`totalPaid` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insurancePool_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposerId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`tier` enum('emergency','operational','strategic') NOT NULL,
	`status` enum('active','passed','rejected','executed') NOT NULL DEFAULT 'active',
	`votingPeriodHours` int NOT NULL,
	`quorumPercentage` int NOT NULL,
	`approvalThreshold` int NOT NULL,
	`votesFor` int NOT NULL DEFAULT 0,
	`votesAgainst` int NOT NULL DEFAULT 0,
	`totalVotingPower` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`votingEndsAt` timestamp NOT NULL,
	`executedAt` timestamp,
	CONSTRAINT `proposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rideId` int NOT NULL,
	`raterId` int NOT NULL,
	`ratedId` int NOT NULL,
	`ratingType` enum('driver_to_rider','rider_to_driver') NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`riderId` int NOT NULL,
	`driverId` int,
	`vehicleId` int,
	`status` enum('requested','accepted','driver_arriving','in_progress','completed','cancelled') NOT NULL DEFAULT 'requested',
	`pickupAddress` text NOT NULL,
	`pickupLat` varchar(20) NOT NULL,
	`pickupLng` varchar(20) NOT NULL,
	`dropoffAddress` text NOT NULL,
	`dropoffLat` varchar(20) NOT NULL,
	`dropoffLng` varchar(20) NOT NULL,
	`estimatedDistance` int,
	`estimatedDuration` int,
	`estimatedFare` int,
	`actualFare` int,
	`insuranceFee` int,
	`developerFee` int,
	`buybackFee` int,
	`driverEarnings` int,
	`rideTokensAwarded` int,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`cancelledAt` timestamp,
	`cancellationReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `safetyIncidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rideId` int NOT NULL,
	`reporterId` int NOT NULL,
	`incidentType` enum('sos_triggered','harassment','accident','unsafe_driving','other') NOT NULL,
	`description` text NOT NULL,
	`location` text,
	`status` enum('reported','under_review','resolved','escalated') NOT NULL DEFAULT 'reported',
	`resolutionNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `safetyIncidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tokenTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`transactionType` enum('ride_reward','buyback_burn','governance_reward','transfer') NOT NULL,
	`amount` int NOT NULL,
	`rideId` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tokenTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`driverId` int NOT NULL,
	`make` varchar(50) NOT NULL,
	`model` varchar(50) NOT NULL,
	`year` int NOT NULL,
	`color` varchar(30) NOT NULL,
	`licensePlate` varchar(20) NOT NULL,
	`vehicleType` enum('sedan','suv','van','luxury') NOT NULL,
	`capacity` int NOT NULL DEFAULT 4,
	`photoUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`voterId` int NOT NULL,
	`voteChoice` enum('for','against') NOT NULL,
	`votingPower` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','driver','rider') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phoneNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `profilePhoto` text;--> statement-breakpoint
ALTER TABLE `users` ADD `rideTokenBalance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `claims` ADD CONSTRAINT `claims_rideId_rides_id_fk` FOREIGN KEY (`rideId`) REFERENCES `rides`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `claims` ADD CONSTRAINT `claims_claimantId_users_id_fk` FOREIGN KEY (`claimantId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `driverProfiles` ADD CONSTRAINT `driverProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emergencyContacts` ADD CONSTRAINT `emergencyContacts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_proposerId_users_id_fk` FOREIGN KEY (`proposerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_rideId_rides_id_fk` FOREIGN KEY (`rideId`) REFERENCES `rides`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_raterId_users_id_fk` FOREIGN KEY (`raterId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_ratedId_users_id_fk` FOREIGN KEY (`ratedId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rides` ADD CONSTRAINT `rides_riderId_users_id_fk` FOREIGN KEY (`riderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rides` ADD CONSTRAINT `rides_driverId_driverProfiles_id_fk` FOREIGN KEY (`driverId`) REFERENCES `driverProfiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rides` ADD CONSTRAINT `rides_vehicleId_vehicles_id_fk` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safetyIncidents` ADD CONSTRAINT `safetyIncidents_rideId_rides_id_fk` FOREIGN KEY (`rideId`) REFERENCES `rides`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safetyIncidents` ADD CONSTRAINT `safetyIncidents_reporterId_users_id_fk` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tokenTransactions` ADD CONSTRAINT `tokenTransactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tokenTransactions` ADD CONSTRAINT `tokenTransactions_rideId_rides_id_fk` FOREIGN KEY (`rideId`) REFERENCES `rides`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_driverId_driverProfiles_id_fk` FOREIGN KEY (`driverId`) REFERENCES `driverProfiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `votes_proposalId_proposals_id_fk` FOREIGN KEY (`proposalId`) REFERENCES `proposals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `votes_voterId_users_id_fk` FOREIGN KEY (`voterId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;