---
title: "SQL Conventions for Laravel"
description: "Comprehensive database naming conventions and best practices for Laravel applications, including table names, columns, keys, and indexing."
date: 2024-06-26
comments: true
tags: ["laravel", "mysql", "database"]
---

When working with Laravel, following consistent SQL conventions is crucial for maintaining a clean and efficient database structure. Below are some recommended conventions for naming tables, columns, keys, and indexing in a Laravel application.

1. **Table Names:**
   - Plural, snake_case (e.g., `users`, `posts`)

2. **Column Names:**
   - Snake_case (e.g., `user_id`, `created_at`)

3. **Primary Keys:**
   - `id`, auto-incrementing integer

4. **Foreign Keys:**
   - Related table name + `_id` (e.g., `user_id`)

5. **Timestamps:**
   - `created_at`, `updated_at`

6. **User Table:**
   ```sql
   CREATE TABLE users (
       id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
       name VARCHAR(255) NOT NULL,
       email VARCHAR(255) UNIQUE NOT NULL,
       password VARCHAR(255) NOT NULL,
       remember_token VARCHAR(100),
       created_at TIMESTAMP NULL,
       updated_at TIMESTAMP NULL
   );
   ```

7. **Posts Table:**
   ```sql
   CREATE TABLE posts (
       id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
       user_id BIGINT UNSIGNED NOT NULL,
       title VARCHAR(255) NOT NULL,
       body TEXT NOT NULL,
       created_at TIMESTAMP NULL,
       updated_at TIMESTAMP NULL,
       FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```

8. **Pivot Table:**
   ```sql
   CREATE TABLE role_user (
       user_id BIGINT UNSIGNED NOT NULL,
       role_id BIGINT UNSIGNED NOT NULL,
       PRIMARY KEY (user_id, role_id),
       FOREIGN KEY (user_id) REFERENCES users(id),
       FOREIGN KEY (role_id) REFERENCES roles(id)
   );
   ```

9. **Indexing Conventions:**
   - Define primary key (e.g., `PRIMARY KEY (id)`)
   - Index foreign keys (e.g., `INDEX (user_id)`)
   - Unique indexes for unique columns (e.g., `UNIQUE (email)`)

10. **Data Types Conventions:**
    - `BIGINT UNSIGNED` for primary keys, `INT UNSIGNED` for foreign keys
    - `VARCHAR(255)` for variable-length strings, `TEXT` for longer texts
    - `TIMESTAMP`, nullable by default for optional timestamps
