-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: fleet_manager_pro
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `__efmigrationshistory`
--

DROP TABLE IF EXISTS `__efmigrationshistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `__efmigrationshistory` (
  `MigrationId` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ProductVersion` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`MigrationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `__efmigrationshistory`
--

LOCK TABLES `__efmigrationshistory` WRITE;
/*!40000 ALTER TABLE `__efmigrationshistory` DISABLE KEYS */;
INSERT INTO `__efmigrationshistory` VALUES ('20250919054522_InitialCreate','8.0.13'),('20250922015046_InitialCreate','8.0.13'),('20250922015118_AddHasHelperToDriver','8.0.13'),('20250923035850_AddHasHelperColumn','8.0.13'),('20250925070231_SyncSchema','8.0.13'),('20250925080049_RemoveUserId1','8.0.13');
/*!40000 ALTER TABLE `__efmigrationshistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `driver_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` datetime(6) NOT NULL,
  `clock_in` time(6) DEFAULT NULL,
  `clock_out` time(6) DEFAULT NULL,
  `total_hours` decimal(4,2) DEFAULT NULL,
  `break_duration` decimal(4,2) NOT NULL,
  `overtime_hours` decimal(4,2) NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `approved_by` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `UserId` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IX_attendance_approved_by` (`approved_by`),
  KEY `IX_attendance_driver_id` (`driver_id`),
  CONSTRAINT `FK_attendance_users_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (1,'d466cb7a-7707-4a43-95a1-472b9e091e22','2025-09-28 00:00:00.000000','23:53:29.399209','23:55:00.521503',0.03,0.00,0.00,'Present','Main Depot','',NULL,'2025-09-28 15:53:29.401886','2025-09-28 15:55:00.524452',NULL),(2,'d466cb7a-7707-4a43-95a1-472b9e091e22','2025-09-29 00:00:00.000000','08:58:17.874171',NULL,NULL,0.00,0.00,'Present','Main Depot','',NULL,'2025-09-29 00:58:17.877094','2025-09-29 00:58:17.877121',NULL);
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IX_audit_log_user_id` (`user_id`),
  CONSTRAINT `FK_audit_log_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drivers_backup`
--

DROP TABLE IF EXISTS `drivers_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drivers_backup` (
  `id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_number` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `license_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `license_class` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `license_expiry` datetime(6) NOT NULL,
  `experience_years` int NOT NULL,
  `total_miles_driven` double NOT NULL,
  `safety_rating` double NOT NULL,
  `current_vehicle_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL,
  `last_location_lat` double DEFAULT NULL,
  `last_location_lng` double DEFAULT NULL,
  `last_location_updated` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `has_helper` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drivers_backup`
--

LOCK TABLES `drivers_backup` WRITE;
/*!40000 ALTER TABLE `drivers_backup` DISABLE KEYS */;
INSERT INTO `drivers_backup` VALUES ('2bf68bf8-7119-4abe-9642-97ccef04ca19','driver','N/A',1,'7f788b9c-2bb5-483f-b2aa-194243f44762','N/A','0001-01-01 00:00:00.000000',0,0,0,NULL,1,NULL,NULL,NULL,'2025-09-23 09:41:48.973568','2025-09-23 09:41:48.973598','d466cb7a-7707-4a43-95a1-472b9e091e22',0),('42a1a42e-eb0e-484e-a6e7-f4f4e0dbf29a','zild','N/A',1,'bf0af5c4-bdf4-4c2d-bbdb-ced257af52d3','N/A','0001-01-01 00:00:00.000000',0,0,0,NULL,1,NULL,NULL,NULL,'2025-09-23 12:36:16.636270','2025-09-23 12:36:16.636288','5f464539-f0c6-4f12-85c3-fec787a366ee',0),('driver-1','Juan Dela Cruz','09171234567',1,'DL-123456','B','2027-01-01 00:00:00.000000',5,10000,4.5,NULL,1,14.5995,120.9842,'2025-09-20 10:27:11.000000','2025-09-20 10:27:11.000000','2025-09-20 10:27:11.000000','user-1',0),('ed373840-87e9-4c98-aa34-ec0fffaff17b','driver','N/A',1,'cdacbca6-8041-41e1-aa76-074ab9c0e3f8','N/A','0001-01-01 00:00:00.000000',0,0,0,NULL,1,NULL,NULL,NULL,'2025-09-23 04:03:13.044756','2025-09-23 04:03:13.044773','8a60c6fe-380f-4e3b-9632-2e4683247c61',0);
/*!40000 ALTER TABLE `drivers_backup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_requests`
--

DROP TABLE IF EXISTS `leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_requests` (
  `id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `driver_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `leave_type_id` int NOT NULL,
  `start_date` datetime(6) NOT NULL,
  `end_date` datetime(6) NOT NULL,
  `total_days` int NOT NULL,
  `reason` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `submitted_date` datetime(6) DEFAULT NULL,
  `approved_by` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` datetime(6) DEFAULT NULL,
  `rejection_reason` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `emergency_contact` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supporting_documents` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `UserId` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IX_leave_requests_approved_by` (`approved_by`),
  KEY `IX_leave_requests_driver_id` (`driver_id`),
  KEY `IX_leave_requests_leave_type_id` (`leave_type_id`),
  CONSTRAINT `FK_leave_requests_leave_types_leave_type_id` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_leave_requests_users_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_requests`
--

LOCK TABLES `leave_requests` WRITE;
/*!40000 ALTER TABLE `leave_requests` DISABLE KEYS */;
INSERT INTO `leave_requests` VALUES ('3e9ff4ee-8f75-4955-b563-217173053b42','d466cb7a-7707-4a43-95a1-472b9e091e22',1,'2025-10-01 00:00:00.000000','2025-10-05 00:00:00.000000',5,'need to go for check up','Pending','2025-09-29 01:44:38.591478',NULL,NULL,NULL,NULL,NULL,'2025-09-29 01:44:38.592029','2025-09-29 01:44:38.592029',NULL),('8d4d37b8-fb7b-4824-b0dc-4ab448010ebc','d466cb7a-7707-4a43-95a1-472b9e091e22',2,'2025-10-05 00:00:00.000000','2025-10-06 00:00:00.000000',2,'Scheduled Check up','Pending','2025-09-29 02:10:18.356066',NULL,NULL,NULL,NULL,NULL,'2025-09-29 02:10:18.356236','2025-09-29 02:10:18.356236',NULL);
/*!40000 ALTER TABLE `leave_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_types`
--

DROP TABLE IF EXISTS `leave_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `max_days_per_year` int DEFAULT NULL,
  `requires_approval` tinyint(1) NOT NULL,
  `advance_notice_days` int DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IX_leave_types_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_types`
--

LOCK TABLES `leave_types` WRITE;
/*!40000 ALTER TABLE `leave_types` DISABLE KEYS */;
INSERT INTO `leave_types` VALUES (1,'Annual','Annual vacation leave for rest and recreation',21,1,7,'2025-09-29 09:43:51.000000'),(2,'Sick','Medical leave for illness or medical appointments',10,0,0,'2025-09-29 09:43:51.000000'),(3,'Personal','Personal leave for individual matters',5,1,3,'2025-09-29 09:43:51.000000'),(4,'Emergency','Emergency leave for urgent unforeseen circumstances',NULL,0,0,'2025-09-29 09:43:51.000000'),(5,'Maternity','Maternity leave for childbirth and newborn care',120,1,30,'2025-09-29 09:43:51.000000'),(6,'Paternity','Paternity leave for fathers supporting newborn care',14,1,14,'2025-09-29 09:43:51.000000'),(7,'Bereavement','Bereavement leave for loss of family members',5,0,0,'2025-09-29 09:43:51.000000'),(8,'Other','Other types of leave not covered by standard categories',NULL,1,7,'2025-09-29 09:43:51.000000');
/*!40000 ALTER TABLE `leave_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_categories`
--

DROP TABLE IF EXISTS `maintenance_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `default_interval_miles` int DEFAULT NULL,
  `default_interval_months` int DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IX_maintenance_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_categories`
--

LOCK TABLES `maintenance_categories` WRITE;
/*!40000 ALTER TABLE `maintenance_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_reminders`
--

DROP TABLE IF EXISTS `maintenance_reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehicle_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` int NOT NULL,
  `reminder_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `next_service_miles` decimal(10,2) DEFAULT NULL,
  `next_service_date` datetime(6) DEFAULT NULL,
  `interval_miles` int DEFAULT NULL,
  `interval_months` int DEFAULT NULL,
  `last_service_date` datetime(6) DEFAULT NULL,
  `last_service_miles` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IX_maintenance_reminders_category_id` (`category_id`),
  KEY `IX_maintenance_reminders_vehicle_id` (`vehicle_id`),
  CONSTRAINT `FK_maintenance_reminders_maintenance_categories_category_id` FOREIGN KEY (`category_id`) REFERENCES `maintenance_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_maintenance_reminders_vehicles_vehicle_id` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_reminders`
--

LOCK TABLES `maintenance_reminders` WRITE;
/*!40000 ALTER TABLE `maintenance_reminders` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_reminders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_tasks`
--

DROP TABLE IF EXISTS `maintenance_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_tasks` (
  `id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` int NOT NULL,
  `task_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `scheduled_date` datetime(6) NOT NULL,
  `completed_date` datetime(6) DEFAULT NULL,
  `scheduled_mileage` decimal(10,2) DEFAULT NULL,
  `completed_mileage` decimal(10,2) DEFAULT NULL,
  `estimated_cost` decimal(10,2) DEFAULT NULL,
  `actual_cost` decimal(10,2) DEFAULT NULL,
  `assigned_to` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `technician_notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `parts_used` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `labor_hours` decimal(4,2) DEFAULT NULL,
  `service_provider` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warranty_until` datetime(6) DEFAULT NULL,
  `created_by` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IX_maintenance_tasks_category_id` (`category_id`),
  KEY `IX_maintenance_tasks_created_by` (`created_by`),
  KEY `IX_maintenance_tasks_vehicle_id` (`vehicle_id`),
  CONSTRAINT `FK_maintenance_tasks_maintenance_categories_category_id` FOREIGN KEY (`category_id`) REFERENCES `maintenance_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_maintenance_tasks_users_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_maintenance_tasks_vehicles_vehicle_id` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_tasks`
--

LOCK TABLES `maintenance_tasks` WRITE;
/*!40000 ALTER TABLE `maintenance_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `related_entity_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `related_entity_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL,
  `is_sent` tinyint(1) NOT NULL,
  `send_email` tinyint(1) NOT NULL,
  `send_sms` tinyint(1) NOT NULL,
  `scheduled_send_time` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `read_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IX_notifications_user_id` (`user_id`),
  CONSTRAINT `FK_notifications_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `route_optimizations`
--

DROP TABLE IF EXISTS `route_optimizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route_optimizations` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `route_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_distance` decimal(8,2) NOT NULL,
  `optimized_distance` decimal(8,2) NOT NULL,
  `distance_saved` decimal(8,2) NOT NULL,
  `original_duration` int NOT NULL,
  `optimized_duration` int NOT NULL,
  `time_saved` int NOT NULL,
  `fuel_saved` decimal(8,2) NOT NULL,
  `optimization_algorithm` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `optimized_at` datetime(6) NOT NULL,
  `optimized_by` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IX_route_optimizations_route_id` (`route_id`),
  KEY `IX_route_optimizations_optimized_by` (`optimized_by`),
  CONSTRAINT `FK_route_optimizations_users_optimized_by` FOREIGN KEY (`optimized_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `route_optimizations`
--

LOCK TABLES `route_optimizations` WRITE;
/*!40000 ALTER TABLE `route_optimizations` DISABLE KEYS */;
/*!40000 ALTER TABLE `route_optimizations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `route_stops`
--

DROP TABLE IF EXISTS `route_stops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route_stops` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `route_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `stop_order` int NOT NULL,
  `address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `estimated_arrival` datetime(6) DEFAULT NULL,
  `actual_arrival` datetime(6) DEFAULT NULL,
  `estimated_departure` datetime(6) DEFAULT NULL,
  `actual_departure` datetime(6) DEFAULT NULL,
  `priority` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `contact_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IX_route_stops_route_id` (`route_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `route_stops`
--

LOCK TABLES `route_stops` WRITE;
/*!40000 ALTER TABLE `route_stops` DISABLE KEYS */;
/*!40000 ALTER TABLE `route_stops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `route_users`
--

DROP TABLE IF EXISTS `route_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route_users` (
  `route_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`route_id`,`user_id`),
  KEY `FK_RouteUsers_Users` (`user_id`),
  CONSTRAINT `FK_route_users_routes` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_RouteUsers_Users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `route_users`
--

LOCK TABLES `route_users` WRITE;
/*!40000 ALTER TABLE `route_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `route_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `routes`
--

DROP TABLE IF EXISTS `routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `routes` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `vehicle_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `driver_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_distance` decimal(10,2) NOT NULL,
  `estimated_duration` int NOT NULL,
  `fuel_estimate` decimal(10,2) NOT NULL,
  `start_time` datetime(6) DEFAULT NULL,
  `end_time` datetime(6) DEFAULT NULL,
  `actual_duration` int DEFAULT NULL,
  `created_by` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IX_routes_created_by` (`created_by`),
  KEY `IX_routes_driver_id` (`driver_id`),
  KEY `IX_routes_vehicle_id` (`vehicle_id`),
  CONSTRAINT `FK_routes_vehicles_vehicle_id` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `routes`
--

LOCK TABLES `routes` WRITE;
/*!40000 ALTER TABLE `routes` DISABLE KEYS */;
/*!40000 ALTER TABLE `routes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `setting_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_public` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IX_system_settings_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `date_of_birth` datetime(6) DEFAULT NULL,
  `hire_date` datetime(6) DEFAULT NULL,
  `emergency_contact` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `license_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_class` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_expiry` datetime DEFAULT NULL,
  `experience_years` int DEFAULT '0',
  `safety_rating` decimal(3,2) DEFAULT NULL,
  `total_miles_driven` decimal(12,2) DEFAULT NULL,
  `current_vehicle_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `has_helper` tinyint(1) DEFAULT '0',
  `last_location_lat` decimal(10,8) DEFAULT NULL,
  `last_location_lng` decimal(11,8) DEFAULT NULL,
  `last_location_updated` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IX_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('5f2e2850-1dce-404d-ae72-08db2e5f053d','ken','ken@test.com','$2a$11$hR0DFssVklpziHzx3dHNNuvI.Z9RZbL5DyMmYdsVxxZXywXtw66X6','Driver',NULL,NULL,NULL,NULL,NULL,'Active',NULL,'2025-09-25 01:50:05.840972','2025-09-25 01:50:05.840992','8641db1b-d728-4865-954e-61756082fab2','N/A',NULL,0,0.00,0.00,NULL,1,0,NULL,NULL,NULL),('a2305670-9c39-4155-b3f8-2fcd16f88d3e','James Francis Bravo De Ocampo','test@test.com','$2a$11$JaV3WBkQx5453gh/xFksmurPmYG/krhSQ7J0YTg4rKyewYzMm1ra6','Driver','09763619691','Blk 1 Lot 6, Mahogany Place, Brgy. Kayumanggi\nLipa City, Batangas','2001-01-01 00:00:00.000000',NULL,'1212121','Active',NULL,'2025-09-26 03:01:26.918775','2025-09-27 02:58:29.706312','1234456','B','2001-01-01 00:00:00',1,3.40,120000.00,NULL,1,0,NULL,NULL,NULL),('d466cb7a-7707-4a43-95a1-472b9e091e22','driver','driver@test.com','$2a$11$LW7IAc/hx0r0AhWezkdcAuFjlC9ktb1lAT9QpIL1/nuano62BJhdy','Driver','N/A','Blk 1 Lot 6, Mahogany Place, Brgy. Kayumanggi','2001-01-01 00:00:00.000000',NULL,'09763619691','Active','123','2025-09-23 09:41:48.960630','2025-09-24 10:49:59.000000','7f788b9c-2bb5-483f-b2aa-194243f44762','N/A','0001-01-01 00:00:00',0,0.00,0.00,NULL,1,0,NULL,NULL,NULL),('f03c0990-8cbd-4bef-8e2d-a07ed4e47d33','admin','admin@test.com','$2a$11$7W8QANDdY1SrqCgkSBRg1OD1Xc3LDZnUwTME2iJLTYhaUwAUpEP5C','Admin',NULL,NULL,NULL,NULL,NULL,'Active',NULL,'2025-09-20 02:53:02.196003','2025-09-20 02:53:02.196021',NULL,NULL,NULL,0,0.00,0.00,NULL,1,0,NULL,NULL,NULL),('user-1','Juan Dela Cruz','driver1@test.com','123456','Driver','09171234567',NULL,NULL,NULL,NULL,'Active',NULL,'2025-09-20 10:26:58.000000','2025-09-24 10:49:59.000000','DL-123456','B','2027-01-01 00:00:00',5,4.00,10000.00,NULL,1,0,14.59950000,120.98420000,'2025-09-20 10:27:11');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_categories`
--

DROP TABLE IF EXISTS `vehicle_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_categories` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IX_vehicle_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_categories`
--

LOCK TABLES `vehicle_categories` WRITE;
/*!40000 ALTER TABLE `vehicle_categories` DISABLE KEYS */;
INSERT INTO `vehicle_categories` VALUES ('1','Truck','Heavy duty transport truck','2025-09-20 10:23:51.000000');
/*!40000 ALTER TABLE `vehicle_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `make` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int NOT NULL,
  `license_plate` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fuel_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fuel_capacity` decimal(10,2) DEFAULT NULL,
  `current_mileage` decimal(10,2) NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_driver_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_location_lat` decimal(10,8) DEFAULT NULL,
  `current_location_lng` decimal(11,8) DEFAULT NULL,
  `last_location_updated` datetime(6) DEFAULT NULL,
  `fuel_level` decimal(10,2) NOT NULL,
  `registration_expiry` datetime(6) NOT NULL,
  `insurance_expiry` datetime(6) NOT NULL,
  `insurance_policy` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purchase_date` datetime(6) DEFAULT NULL,
  `purchase_price` decimal(12,2) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IX_vehicles_license_plate` (`license_plate`),
  KEY `IX_vehicles_category_id` (`category_id`),
  CONSTRAINT `FK_vehicles_vehicle_categories_category_id` FOREIGN KEY (`category_id`) REFERENCES `vehicle_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicles`
--

LOCK TABLES `vehicles` WRITE;
/*!40000 ALTER TABLE `vehicles` DISABLE KEYS */;
INSERT INTO `vehicles` VALUES ('13c4c07b-faa4-4370-8829-5692b0ba6427','1','Ford','F-150',2025,'CBA-564','White','Gasoline',12000.00,12000.00,'OnRoute','5f2e2850-1dce-404d-ae72-08db2e5f053d',NULL,NULL,NULL,100.00,'2000-12-29 00:00:00.000000','2001-10-07 00:00:00.000000','01010','2000-12-29 00:00:00.000000',12000.00,'2025-09-28 01:58:41.790675','2025-09-28 02:00:15.430499'),('31dcd57e-87a7-48c1-8c14-b768a4fb473d','1','Toyota','Transit',2025,'CBA-321','Blue','Gasoline',1200.00,12000.00,'OutOfService','5f2e2850-1dce-404d-ae72-08db2e5f053d',NULL,NULL,NULL,100.00,'2000-12-29 00:00:00.000000','2000-12-29 00:00:00.000000','dadas','2000-12-29 00:00:00.000000',12000.00,'2025-09-25 08:13:05.624218','2025-09-28 01:55:54.964001'),('45ad9016-9406-4330-accb-1060ddd581cb','1','Ford','F-150',2025,'ABC-132','Red','Gasoline',123000.00,12300.00,'Ready',NULL,NULL,NULL,NULL,100.00,'2002-01-01 00:00:00.000000','2002-01-01 00:00:00.000000','123','2002-01-01 00:00:00.000000',120000.00,'2025-09-23 12:37:12.535884','2025-09-23 12:37:12.535898'),('5bebfd58-0c49-4d76-99f4-33998dd93f70','1','Ford','F-150',2025,'ABC-123','Red','Gasoline',12000.00,1200.00,'Ready',NULL,NULL,NULL,NULL,100.00,'2001-01-01 00:00:00.000000','2001-01-01 00:00:00.000000','1200','2001-01-01 00:00:00.000000',10000.00,'2025-09-23 09:36:08.567235','2025-09-23 09:36:08.567252'),('veh-1','1','Isuzu','Giga',2020,'ABC-1234','White','Diesel',200.00,15000.00,'Ready',NULL,NULL,NULL,NULL,100.00,'2026-12-31 00:00:00.000000','2026-06-30 00:00:00.000000','POL123456',NULL,NULL,'2025-09-20 10:29:49.000000','2025-09-20 10:29:49.000000'),('veh-2','1','Fuso','Fighter',2019,'XYZ-5678','Blue','Diesel',180.00,22000.00,'Maintenance',NULL,NULL,NULL,NULL,50.00,'2026-11-30 00:00:00.000000','2026-05-31 00:00:00.000000','POL654321',NULL,NULL,'2025-09-20 10:29:49.000000','2025-09-20 10:29:49.000000'),('veh-3','1','Hino','Ranger',2021,'LMN-2468','Red','Diesel',210.00,12000.00,'NotAvailable',NULL,NULL,NULL,NULL,75.00,'2027-01-15 00:00:00.000000','2026-07-31 00:00:00.000000','POL789012',NULL,NULL,'2025-09-20 10:29:49.000000','2025-09-20 10:29:49.000000');
/*!40000 ALTER TABLE `vehicles` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-29 10:12:37
