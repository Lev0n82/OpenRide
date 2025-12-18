CREATE TABLE `driverApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`vehicleMake` varchar(50),
	`vehicleModel` varchar(50),
	`vehicleYear` int,
	`vehicleColor` varchar(30),
	`licensePlate` varchar(20),
	`passengerCapacity` int DEFAULT 4,
	`piKycStatus` enum('pending','in_progress','verified','failed') NOT NULL DEFAULT 'pending',
	`piUserId` varchar(100),
	`status` enum('draft','submitted','under_review','approved','rejected') NOT NULL DEFAULT 'draft',
	`rejectionReason` text,
	`submittedAt` timestamp,
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `driverApplications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `driverDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`documentType` enum('license','insurance','registration') NOT NULL,
	`fileUrl` text NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`verificationStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`verificationNotes` text,
	`verifiedBy` int,
	`verifiedAt` timestamp,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `driverDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `driverApplications` ADD CONSTRAINT `driverApplications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `driverApplications` ADD CONSTRAINT `driverApplications_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `driverDocuments` ADD CONSTRAINT `driverDocuments_applicationId_driverApplications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `driverApplications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `driverDocuments` ADD CONSTRAINT `driverDocuments_verifiedBy_users_id_fk` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;