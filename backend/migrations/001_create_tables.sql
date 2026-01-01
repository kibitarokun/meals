-- Migration: 001_create_tables.sql
-- Create shared_meals table with meal_type support
CREATE TABLE IF NOT EXISTS shared_meals (
    meal_date TEXT NOT NULL,
    meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner')),
    menu_name TEXT NOT NULL,
    memo TEXT,
    image_url TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (meal_date, meal_type)
);

-- Create meal_comments table with meal_type support
CREATE TABLE IF NOT EXISTS meal_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_date TEXT NOT NULL,
    meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner')),
    comment_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meal_date, meal_type) REFERENCES shared_meals(meal_date, meal_type)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_meal_date_type ON meal_comments(meal_date, meal_type);
CREATE INDEX IF NOT EXISTS idx_created_at ON meal_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meal_date ON shared_meals(meal_date DESC);
