-- Migration: 001_create_tables.sql
-- Create shared_meals table
CREATE TABLE IF NOT EXISTS shared_meals (
    meal_date TEXT PRIMARY KEY,
    menu_name TEXT NOT NULL,
    memo TEXT,
    image_url TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create meal_comments table
CREATE TABLE IF NOT EXISTS meal_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_date TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meal_date) REFERENCES shared_meals(meal_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_meal_date ON meal_comments(meal_date);
CREATE INDEX IF NOT EXISTS idx_created_at ON meal_comments(created_at DESC);
