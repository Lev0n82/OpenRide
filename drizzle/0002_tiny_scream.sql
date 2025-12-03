ALTER TABLE `driverProfiles` ADD `offersDelivery` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `driverProfiles` ADD `maxPackageWeight` int DEFAULT 20;--> statement-breakpoint
ALTER TABLE `driverProfiles` ADD `maxPackageSize` enum('small','medium','large','xlarge') DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE `driverProfiles` ADD `totalDeliveries` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `rides` ADD `serviceType` enum('ride','delivery') DEFAULT 'ride' NOT NULL;--> statement-breakpoint
ALTER TABLE `rides` ADD `packageDescription` text;--> statement-breakpoint
ALTER TABLE `rides` ADD `packageWeight` int;--> statement-breakpoint
ALTER TABLE `rides` ADD `packageSize` enum('small','medium','large','xlarge');--> statement-breakpoint
ALTER TABLE `rides` ADD `recipientName` varchar(100);--> statement-breakpoint
ALTER TABLE `rides` ADD `recipientPhone` varchar(20);--> statement-breakpoint
ALTER TABLE `rides` ADD `deliveryInstructions` text;--> statement-breakpoint
ALTER TABLE `rides` ADD `proofOfDeliveryUrl` text;