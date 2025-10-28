ALTER TABLE `project_analysis` ADD `rlsPolicies` text;--> statement-breakpoint
ALTER TABLE `project_analysis` ADD `storageBuckets` text;--> statement-breakpoint
ALTER TABLE `project_analysis` ADD `serverlessFunctions` text;--> statement-breakpoint
ALTER TABLE `project_analysis` ADD `promptLibrary` text;--> statement-breakpoint
ALTER TABLE `project_analysis` ADD `githubRepoUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `project_analysis` ADD `vercelProjectUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `project_analysis` ADD `deploymentStatus` varchar(50);