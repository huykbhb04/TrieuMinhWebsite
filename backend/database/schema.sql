CREATE DATABASE IF NOT EXISTS `trieuminh` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `trieuminh`;

CREATE TABLE IF NOT EXISTS `consultations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `topic` VARCHAR(160) NOT NULL DEFAULT 'Tôi bị viêm xoang',
  `message` TEXT NULL,
  `status` ENUM('new', 'contacted', 'closed') NOT NULL DEFAULT 'new',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_consultations_status_created` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(180) NOT NULL,
  `slug` VARCHAR(200) NOT NULL UNIQUE,
  `sku` VARCHAR(80) NULL UNIQUE,
  `category` VARCHAR(120) NULL,
  `description` TEXT NULL,
  `ingredients` TEXT NULL,
  `benefits` TEXT NULL,
  `usage_instructions` TEXT NULL,
  `price` DECIMAL(12,0) NULL,
  `compare_at_price` DECIMAL(12,0) NULL,
  `image_url` VARCHAR(500) NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `unit` VARCHAR(40) NOT NULL DEFAULT 'Sản phẩm',
  `featured` BOOLEAN NOT NULL DEFAULT FALSE,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_products_active_created` (`active`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `coupons` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(60) NOT NULL UNIQUE,
  `discount_type` ENUM('fixed', 'percent') NOT NULL,
  `discount_value` DECIMAL(12,0) NOT NULL,
  `min_subtotal` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `max_discount` DECIMAL(12,0) NULL,
  `starts_at` DATETIME NULL,
  `expires_at` DATETIME NULL,
  `usage_limit` INT NULL,
  `used_count` INT NOT NULL DEFAULT 0,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), INDEX `idx_coupons_active_window` (`active`, `starts_at`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number` VARCHAR(40) NOT NULL UNIQUE,
  `idempotency_key` VARCHAR(120) NULL UNIQUE,
  `customer_id` BIGINT UNSIGNED NULL,
  `customer_name` VARCHAR(120) NOT NULL,
  `customer_phone` VARCHAR(30) NOT NULL,
  `province_code` VARCHAR(30) NOT NULL,
  `province_name` VARCHAR(160) NOT NULL,
  `district_code` VARCHAR(30) NOT NULL,
  `district_name` VARCHAR(160) NOT NULL,
  `ward_code` VARCHAR(30) NOT NULL,
  `ward_name` VARCHAR(160) NOT NULL,
  `address_line` VARCHAR(300) NOT NULL,
  `current_province_code` VARCHAR(30) NULL,
  `current_province_name` VARCHAR(160) NULL,
  `current_ward_code` VARCHAR(30) NULL,
  `current_ward_name` VARCHAR(160) NULL,
  `normalized_address` VARCHAR(500) NULL,
  `address_mapping_status` ENUM('resolved', 'ambiguous', 'unresolved') NOT NULL DEFAULT 'unresolved',
  `address_mapping_provider` VARCHAR(120) NULL,
  `address_normalized_at` DATETIME NULL,
  `note` TEXT NULL,
  `coupon_code` VARCHAR(60) NULL,
  `subtotal` DECIMAL(12,0) NOT NULL,
  `discount_total` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `shipping_fee` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `total` DECIMAL(12,0) NOT NULL,
  `payment_method` ENUM('cod', 'qr') NOT NULL,
  `payment_status` ENUM('pending', 'paid', 'failed', 'config_pending', 'expired') NOT NULL DEFAULT 'pending',
  `order_status` ENUM('pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `payment_reference` VARCHAR(120) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), INDEX `idx_orders_status_created` (`order_status`, `created_at`), INDEX `idx_orders_payment` (`payment_status`, `created_at`), INDEX `idx_orders_phone` (`customer_phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NULL,
  `product_name` VARCHAR(180) NOT NULL,
  `product_slug` VARCHAR(200) NOT NULL,
  `product_sku` VARCHAR(80) NULL,
  `image_url` VARCHAR(500) NULL,
  `unit` VARCHAR(40) NOT NULL,
  `unit_price` DECIMAL(12,0) NOT NULL,
  `quantity` INT NOT NULL,
  `line_total` DECIMAL(12,0) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), INDEX `idx_order_items_order` (`order_id`), CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `chat_conversations` (
  `id` CHAR(36) NOT NULL,
  `guest_session_id` CHAR(36) NOT NULL UNIQUE,
  `customer_id` BIGINT UNSIGNED NULL,
  `guest_name` VARCHAR(120) NOT NULL,
  `mode` ENUM('ai', 'manual') NOT NULL DEFAULT 'manual',
  `status` ENUM('open', 'waiting', 'assigned', 'closed') NOT NULL DEFAULT 'open',
  `assigned_user_id` BIGINT UNSIGNED NULL,
  `unread_for_staff` INT NOT NULL DEFAULT 0,
  `unread_for_guest` INT NOT NULL DEFAULT 0,
  `consent_at` DATETIME NULL,
  `last_message_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), INDEX `idx_chat_status_last` (`status`, `last_message_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` CHAR(36) NOT NULL,
  `sender_type` ENUM('guest', 'customer', 'staff', 'admin', 'ai', 'system') NOT NULL,
  `sender_user_id` BIGINT UNSIGNED NULL,
  `client_message_id` CHAR(36) NULL,
  `message_type` ENUM('text', 'image') NOT NULL DEFAULT 'text',
  `media_url` VARCHAR(500) NULL,
  `body` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` DATETIME NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_chat_client_message` (`conversation_id`, `client_message_id`), INDEX `idx_chat_messages_conversation` (`conversation_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_handoffs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` CHAR(36) NOT NULL,
  `reason` VARCHAR(255) NULL,
  `status` ENUM('requested', 'claimed', 'resolved', 'closed') NOT NULL DEFAULT 'requested',
  `assigned_user_id` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), INDEX `idx_chat_handoffs_status` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `username` VARCHAR(60) NULL UNIQUE,
  `email` VARCHAR(190) NULL UNIQUE,
  `phone` VARCHAR(30) NULL,
  `password_hash` VARCHAR(180) NOT NULL,
  `role` ENUM('customer', 'staff', 'admin') NOT NULL DEFAULT 'customer',
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_role_active` (`role`, `active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `site_links` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(120) NOT NULL,
  `link_type` ENUM('messenger', 'zalo', 'phone', 'email', 'social', 'custom') NOT NULL DEFAULT 'custom',
  `url` VARCHAR(500) NOT NULL,
  `display_label` VARCHAR(160) NULL,
  `icon_key` VARCHAR(40) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), INDEX `idx_site_links_public_order` (`active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(80) NOT NULL UNIQUE,
  `setting_value` VARCHAR(500) NOT NULL DEFAULT '',
  `is_public` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
