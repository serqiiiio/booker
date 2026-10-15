-- Separate database for Vitest/Playwright, so tests never touch dev data.
CREATE DATABASE booker_test OWNER booker;
