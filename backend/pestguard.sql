-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 17, 2026 at 09:57 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pestguard`
--

-- --------------------------------------------------------

--
-- Table structure for table `emergency_contacts`
--

CREATE TABLE `emergency_contacts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `role` varchar(80) DEFAULT NULL,
  `phone` varchar(30) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `scan_id` int(11) DEFAULT NULL,
  `pest_class` varchar(100) NOT NULL,
  `severity` varchar(20) NOT NULL,
  `crop_affected` varchar(100) DEFAULT NULL,
  `estimated_area_hectares` float DEFAULT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `region` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `image_data` text DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `scans`
--

CREATE TABLE `scans` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `image_data` text DEFAULT NULL,
  `predicted_class` varchar(100) NOT NULL,
  `confidence` float NOT NULL,
  `all_predictions` text DEFAULT NULL,
  `detections` text DEFAULT NULL,
  `image_width` int(11) DEFAULT NULL,
  `image_height` int(11) DEFAULT NULL,
  `used_real_model` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `scans`
--

INSERT INTO `scans` (`id`, `user_id`, `image_path`, `image_data`, `predicted_class`, `confidence`, `all_predictions`, `detections`, `image_width`, `image_height`, `used_real_model`, `created_at`) VALUES
(1, 1, 'scans/08003596800548d087bc4189afea7205.jpg', NULL, 'red spider', 0.779878, '{\"red spider\": 0.7798781991004944}', '[{\"class_name\": \"red spider\", \"confidence\": 0.7798781991004944, \"box\": {\"x1\": 73.07906341552734, \"y1\": 86.15037536621094, \"x2\": 323.7198791503906, \"y2\": 248.8453826904297}}]', 411, 333, 1, '2026-05-16 10:20:09'),
(2, 1, 'scans/b7ba76ff23c14bfa8a6bf906dbd0b659.jpg', NULL, 'Prodenia litura', 0.41815, '{\"Prodenia litura\": 0.41815030574798584}', '[{\"class_name\": \"Prodenia litura\", \"confidence\": 0.41815030574798584, \"box\": {\"x1\": 73.0078125, \"y1\": 295.72186279296875, \"x2\": 477.4734191894531, \"y2\": 599.9937133789062}}]', 736, 980, 1, '2026-05-16 12:09:19'),
(3, 1, 'scans/182cb2d9f08c4fada7d9fde7368ddcb1.jpg', NULL, 'blister beetle', 0.56086, '{\"blister beetle\": 0.5608596205711365}', '[{\"class_name\": \"blister beetle\", \"confidence\": 0.5608596205711365, \"box\": {\"x1\": 42.82730484008789, \"y1\": 357.6811828613281, \"x2\": 673.6109008789062, \"y2\": 793.27734375}}]', 680, 1020, 1, '2026-05-16 12:11:37'),
(4, 1, 'scans/9c74d55a355a4b69b5068faf2539eaa0.jpg', NULL, 'black cutworm', 0.302919, '{\"black cutworm\": 0.3029192090034485}', '[{\"class_name\": \"black cutworm\", \"confidence\": 0.3029192090034485, \"box\": {\"x1\": 52.40685272216797, \"y1\": 276.16485595703125, \"x2\": 650.4581909179688, \"y2\": 999.9746704101562}}]', 736, 1104, 1, '2026-05-16 12:11:56'),
(5, 1, 'scans/c9726a17637c4c8bbf19d843baff5efb.jpg', NULL, 'blister beetle', 0.323612, '{\"blister beetle\": 0.32361218333244324}', '[{\"class_name\": \"blister beetle\", \"confidence\": 0.32361218333244324, \"box\": {\"x1\": 16.856143951416016, \"y1\": 152.77857971191406, \"x2\": 364.51837158203125, \"y2\": 640.0}}]', 457, 640, 1, '2026-05-16 12:12:15'),
(6, 1, 'scans/bae756f6bc614ac0bd4eef20326be41e.jpg', NULL, 'asiatic rice borer', 0.778842, '{\"asiatic rice borer\": 0.7788424491882324}', '[{\"class_name\": \"asiatic rice borer\", \"confidence\": 0.7788424491882324, \"box\": {\"x1\": 146.65501403808594, \"y1\": 36.20348358154297, \"x2\": 414.9042663574219, \"y2\": 738.1029663085938}}]', 561, 749, 1, '2026-05-16 12:14:33');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(80) NOT NULL,
  `email` varchar(120) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `farm_name` varchar(120) DEFAULT NULL,
  `farm_size_hectares` float DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `phone`, `region`, `farm_name`, `farm_size_hectares`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'tadi', 'bulle@gmail.com', '$2b$12$FdbgNr/2p9pYnPfxXBRnCe3gvJliY4QL3OzeEnjbJjaqsU/E4FWHa', 'Tadiwa Murahwa', '+263 714825243', 'Masvingo', 'Green Fields', 2, 1, '2026-05-16 09:05:55', '2026-05-16 09:05:55');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `emergency_contacts`
--
ALTER TABLE `emergency_contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `scan_id` (`scan_id`);

--
-- Indexes for table `scans`
--
ALTER TABLE `scans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_users_email` (`email`),
  ADD UNIQUE KEY `ix_users_username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `emergency_contacts`
--
ALTER TABLE `emergency_contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `scans`
--
ALTER TABLE `scans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `emergency_contacts`
--
ALTER TABLE `emergency_contacts`
  ADD CONSTRAINT `emergency_contacts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`scan_id`) REFERENCES `scans` (`id`);

--
-- Constraints for table `scans`
--
ALTER TABLE `scans`
  ADD CONSTRAINT `scans_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
