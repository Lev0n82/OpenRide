CREATE TABLE `demand_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationLat` varchar(20) NOT NULL,
	`locationLng` varchar(20) NOT NULL,
	`gridCellId` varchar(50) NOT NULL,
	`hourOfDay` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`isWeekend` boolean NOT NULL,
	`isHoliday` boolean NOT NULL DEFAULT false,
	`requestCount` int NOT NULL DEFAULT 0,
	`completedRideCount` int NOT NULL DEFAULT 0,
	`cancelledRideCount` int NOT NULL DEFAULT 0,
	`averageWaitTime` int,
	`averageFare` int,
	`availableDriverCount` int NOT NULL DEFAULT 0,
	`supplyDemandRatio` int,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `demand_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `driver_positioning_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`driverId` int NOT NULL,
	`recommendedLat` varchar(20) NOT NULL,
	`recommendedLng` varchar(20) NOT NULL,
	`recommendedGridCell` varchar(50) NOT NULL,
	`locationName` varchar(200),
	`predictedDemand` int NOT NULL,
	`predictedEarnings` int NOT NULL,
	`confidenceScore` int NOT NULL,
	`validFrom` timestamp NOT NULL,
	`validUntil` timestamp NOT NULL,
	`wasSent` boolean NOT NULL DEFAULT false,
	`wasFollowed` boolean NOT NULL DEFAULT false,
	`actualEarnings` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `driver_positioning_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matching_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rideId` int NOT NULL,
	`riderId` int NOT NULL,
	`driverId` int,
	`riderRating` int NOT NULL,
	`riderTotalRides` int NOT NULL,
	`riderIsPremium` boolean NOT NULL DEFAULT false,
	`driverRating` int,
	`driverTotalRides` int,
	`driverIsPremium` boolean NOT NULL DEFAULT false,
	`driverDistance` int,
	`driverEta` int,
	`matchingAlgorithm` varchar(50) NOT NULL,
	`wasPremiumMatch` boolean NOT NULL DEFAULT false,
	`matchScore` int,
	`wasAccepted` boolean NOT NULL,
	`wasCompleted` boolean NOT NULL,
	`finalRiderRating` int,
	`finalDriverRating` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `matching_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ml_model_performance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`modelName` varchar(100) NOT NULL,
	`modelVersion` varchar(50) NOT NULL,
	`accuracyScore` int,
	`precisionScore` int,
	`recallScore` int,
	`f1Score` int,
	`maeScore` int,
	`rmseScore` int,
	`revenueImpact` int,
	`customerSatisfaction` int,
	`driverSatisfaction` int,
	`isActive` boolean NOT NULL DEFAULT false,
	`deployedAt` timestamp,
	`evaluatedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ml_model_performance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricing_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rideId` int,
	`pickupGridCell` varchar(50) NOT NULL,
	`dropoffGridCell` varchar(50) NOT NULL,
	`distance` int NOT NULL,
	`requestedAt` timestamp NOT NULL,
	`hourOfDay` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`isWeekend` boolean NOT NULL,
	`baseFare` int NOT NULL,
	`surgeMultiplier` int NOT NULL DEFAULT 100,
	`finalFare` int NOT NULL,
	`competitorAvgPrice` int,
	`demandLevel` varchar(20) NOT NULL,
	`availableDrivers` int NOT NULL,
	`pendingRequests` int NOT NULL,
	`wasAccepted` boolean NOT NULL,
	`acceptanceTime` int,
	`wasCompleted` boolean NOT NULL,
	`customerRating` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pricing_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `driver_positioning_recommendations` ADD CONSTRAINT `driver_positioning_recommendations_driverId_driverProfiles_id_fk` FOREIGN KEY (`driverId`) REFERENCES `driverProfiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matching_analytics` ADD CONSTRAINT `matching_analytics_rideId_rides_id_fk` FOREIGN KEY (`rideId`) REFERENCES `rides`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matching_analytics` ADD CONSTRAINT `matching_analytics_riderId_users_id_fk` FOREIGN KEY (`riderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matching_analytics` ADD CONSTRAINT `matching_analytics_driverId_driverProfiles_id_fk` FOREIGN KEY (`driverId`) REFERENCES `driverProfiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pricing_history` ADD CONSTRAINT `pricing_history_rideId_rides_id_fk` FOREIGN KEY (`rideId`) REFERENCES `rides`(`id`) ON DELETE no action ON UPDATE no action;