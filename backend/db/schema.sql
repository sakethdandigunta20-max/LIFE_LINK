-- Smart Blood & Organ Donation Matching System
-- MySQL Schema

CREATE DATABASE IF NOT EXISTS blood_organ_donation
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE blood_organ_donation;

-- ============ USERS ============
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('donor','recipient','bloodbank','hospital','admin') NOT NULL,
  profile_picture VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============ DONOR PROFILES ============
CREATE TABLE donor_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  blood_group ENUM('A+','A-','B+','B-','O+','O-','AB+','AB-') NOT NULL,
  date_of_birth DATE,
  gender ENUM('male','female','other'),
  weight_kg DECIMAL(5,2),
  medical_conditions TEXT,
  is_organ_donor TINYINT(1) DEFAULT 0,
  organ_types VARCHAR(255) DEFAULT NULL, -- comma separated: kidney,liver,heart,lungs,cornea,pancreas
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  last_donation_date DATE,
  is_available TINYINT(1) DEFAULT 1,
  eligibility_status ENUM('eligible','not_eligible','pending_review') DEFAULT 'eligible',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============ RECIPIENT PROFILES ============
CREATE TABLE recipient_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  blood_group ENUM('A+','A-','B+','B-','O+','O-','AB+','AB-'),
  date_of_birth DATE,
  gender ENUM('male','female','other'),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============ HOSPITALS ============
CREATE TABLE hospitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  hospital_name VARCHAR(150) NOT NULL,
  license_number VARCHAR(100),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  contact_person VARCHAR(120),
  is_verified TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============ BLOOD BANKS ============
CREATE TABLE blood_banks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  bank_name VARCHAR(150) NOT NULL,
  license_number VARCHAR(100),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  contact_person VARCHAR(120),
  is_verified TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============ BLOOD INVENTORY ============
CREATE TABLE blood_inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blood_bank_id INT NOT NULL,
  blood_group ENUM('A+','A-','B+','B-','O+','O-','AB+','AB-') NOT NULL,
  units_available INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_bank_group (blood_bank_id, blood_group),
  FOREIGN KEY (blood_bank_id) REFERENCES blood_banks(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============ BLOOD REQUESTS ============
CREATE TABLE blood_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_id INT NOT NULL,
  hospital_id INT DEFAULT NULL,
  blood_bank_id INT DEFAULT NULL,
  blood_group ENUM('A+','A-','B+','B-','O+','O-','AB+','AB-') NOT NULL,
  units_needed INT DEFAULT 1,
  urgency ENUM('low','medium','high','critical') DEFAULT 'medium',
  status ENUM('pending','approved','rejected','fulfilled','cancelled') DEFAULT 'pending',
  document_path VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES recipient_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
  FOREIGN KEY (blood_bank_id) REFERENCES blood_banks(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============ ORGAN REQUESTS ============
CREATE TABLE organ_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_id INT NOT NULL,
  hospital_id INT DEFAULT NULL,
  organ_type ENUM('kidney','liver','heart','lungs','cornea','pancreas','skin','bone_marrow') NOT NULL,
  urgency ENUM('low','medium','high','critical') DEFAULT 'medium',
  status ENUM('pending','approved','rejected','fulfilled','cancelled') DEFAULT 'pending',
  document_path VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES recipient_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============ DONATIONS (fulfilled matches / history) ============
CREATE TABLE donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donor_id INT NOT NULL,
  type ENUM('blood','organ') NOT NULL,
  blood_request_id INT DEFAULT NULL,
  organ_request_id INT DEFAULT NULL,
  hospital_id INT DEFAULT NULL,
  blood_bank_id INT DEFAULT NULL,
  status ENUM('scheduled','completed','cancelled') DEFAULT 'scheduled',
  donation_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donor_id) REFERENCES donor_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (blood_request_id) REFERENCES blood_requests(id) ON DELETE SET NULL,
  FOREIGN KEY (organ_request_id) REFERENCES organ_requests(id) ON DELETE SET NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
  FOREIGN KEY (blood_bank_id) REFERENCES blood_banks(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============ NOTIFICATIONS ============
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info','success','warning','emergency') DEFAULT 'info',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Indexes for performance
CREATE INDEX idx_donor_blood_group ON donor_profiles(blood_group);
CREATE INDEX idx_donor_availability ON donor_profiles(is_available);
CREATE INDEX idx_donor_city ON donor_profiles(city);
CREATE INDEX idx_blood_req_status ON blood_requests(status);
CREATE INDEX idx_organ_req_status ON organ_requests(status);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
