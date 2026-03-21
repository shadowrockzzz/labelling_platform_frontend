#!/usr/bin/env node
/**
 * Seed/unseed test users for E2E tests
 * 
 * SEED: node scripts/seedTestUsers.js --with-existing-admin
 *   Requires EXISTING_ADMIN_EMAIL and EXISTING_ADMIN_PASSWORD env vars
 * 
 * UNSEED: node scripts/seedTestUsers.js --clean --with-existing-admin
 *   Removes only test users created by this script (matching @labelling.example.com)
 */

const path = require("path");
const dotenv = require("dotenv");
const axios = require("axios");

// Load env file
dotenv.config({ path: path.join(__dirname, "..", ".env.test") });

const API_BASE = process.env.TEST_API_BASE_URL || "http://localhost:8000/api/v1";

// Test users - these emails will be deleted during --clean
const TEST_USERS = [
  {
    email: process.env.TEST_ADMIN_EMAIL || "test_admin@labelling.example.com",
    password: process.env.TEST_ADMIN_PASSWORD || "TestAdmin@123",
    full_name: "Test Admin",
    role: "admin",
  },
  {
    email: process.env.TEST_PM_EMAIL || "test_pm@labelling.example.com",
    password: process.env.TEST_PM_PASSWORD || "TestPM@123",
    full_name: "Test Project Manager",
    role: "project_manager",
  },
  {
    email: process.env.TEST_REVIEWER_EMAIL || "test_reviewer@labelling.example.com",
    password: process.env.TEST_REVIEWER_PASSWORD || "TestReviewer@123",
    full_name: "Test Reviewer",
    role: "reviewer",
  },
  {
    email: process.env.TEST_ANNOTATOR_EMAIL || "test_annotator@labelling.example.com",
    password: process.env.TEST_ANNOTATOR_PASSWORD || "TestAnnotator@123",
    full_name: "Test Annotator",
    role: "annotator",
  },
];

// Get test email pattern (domain to match for cleanup)
const TEST_EMAIL_DOMAIN = "@labelling.example.com";

async function loginAsAdmin(email, password) {
  try {
    const response = await axios.post(API_BASE + "/auth/login", {
      email: email,
      password: password,
    });
    return response.data.access_token;
  } catch (error) {
    return null;
  }
}

async function createUserWithToken(user, token) {
  try {
    await axios.post(API_BASE + "/auth/register", user, {
      headers: { Authorization: "Bearer " + token }
    });
    console.log("✅ Created: " + user.email + " (" + user.role + ")");
    return true;
  } catch (error) {
    if (error.response && (error.response.status === 400 || error.response.status === 409)) {
      console.log("⏭️  Already exists: " + user.email + " (" + user.role + ")");
      return true;
    }
    console.error("❌ Failed to create " + user.email + ":", error.response ? error.response.data : error.message);
    return false;
  }
}

async function verifyLogin(user) {
  try {
    const response = await axios.post(API_BASE + "/auth/login", {
      email: user.email,
      password: user.password,
    });
    if (response.data.access_token) {
      console.log("✅ Login OK: " + user.email);
      return true;
    }
  } catch (error) {
    console.error("❌ Login failed for " + user.email);
    return false;
  }
}

async function getAllUsers(token) {
  try {
    const response = await axios.get(API_BASE + "/users?limit=1000", {
      headers: { Authorization: "Bearer " + token }
    });
    return response.data.data || [];
  } catch (error) {
    console.error("Failed to get users:", error.response ? error.response.data : error.message);
    return [];
  }
}

async function deleteUser(userId, token) {
  try {
    await axios.delete(API_BASE + "/users/" + userId, {
      headers: { Authorization: "Bearer " + token }
    });
    return true;
  } catch (error) {
    console.error("Failed to delete user " + userId + ":", error.response ? error.response.data : error.message);
    return false;
  }
}

async function seedWithExistingAdmin() {
  // Look for existing admin credentials in env
  const adminEmail = process.env.EXISTING_ADMIN_EMAIL || process.env.TEST_ADMIN_EMAIL;
  const adminPassword = process.env.EXISTING_ADMIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD;

  console.log("Attempting to login with existing admin: " + adminEmail);
  
  const token = await loginAsAdmin(adminEmail, adminPassword);
  if (!token) {
    console.error("\n❌ Could not login as admin.");
    console.error("   Set EXISTING_ADMIN_EMAIL and EXISTING_ADMIN_PASSWORD env vars\n");
    process.exit(1);
  }

  console.log("✅ Logged in as admin\n");
  console.log("Creating test users...\n");

  for (const user of TEST_USERS) {
    await createUserWithToken(user, token);
  }

  // Verify all users can login
  console.log("\nVerifying login for test users...");
  for (const user of TEST_USERS) {
    await verifyLogin(user);
  }

  console.log("\n🎉 Test user seeding complete!");
}

async function cleanTestUsers() {
  // Look for existing admin credentials in env
  const adminEmail = process.env.EXISTING_ADMIN_EMAIL || process.env.TEST_ADMIN_EMAIL;
  const adminPassword = process.env.EXISTING_ADMIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD;

  console.log("Attempting to login with admin to clean test users...\n");
  
  const token = await loginAsAdmin(adminEmail, adminPassword);
  if (!token) {
    console.error("\n❌ Could not login as admin.");
    console.error("   Set EXISTING_ADMIN_EMAIL and EXISTING_ADMIN_PASSWORD env vars\n");
    process.exit(1);
  }

  console.log("✅ Logged in as admin\n");

  // Get all users
  console.log("Fetching all users...");
  const allUsers = await getAllUsers(token);
  
  if (allUsers.length === 0) {
    console.log("No users found.");
    return;
  }

  // Filter test users by email domain
  const testUsersToDelete = allUsers.filter(function(user) {
    return user.email && user.email.indexOf(TEST_EMAIL_DOMAIN) !== -1;
  });

  if (testUsersToDelete.length === 0) {
    console.log("No test users found with domain: " + TEST_EMAIL_DOMAIN);
    return;
  }

  console.log("\nFound " + testUsersToDelete.length + " test user(s) to delete:\n");
  testUsersToDelete.forEach(function(user) {
    console.log("  - ID: " + user.id + " | " + user.email + " (" + user.role + ")");
  });

  console.log("\nDeleting test users...\n");

  let deleted = 0;
  let failed = 0;

  for (const user of testUsersToDelete) {
    // Don't delete the admin we're logged in as
    if (user.email === adminEmail) {
      console.log("⏭️  Skipping (current admin): " + user.email);
      continue;
    }
    
    const success = await deleteUser(user.id, token);
    if (success) {
      console.log("🗑️  Deleted: " + user.email);
      deleted++;
    } else {
      failed++;
    }
  }

  console.log("\n================================================================================");
  console.log("CLEANUP COMPLETE");
  console.log("  Deleted: " + deleted);
  if (failed > 0) console.log("  Failed: " + failed);
  console.log("================================================================================\n");
}

function printInstructions() {
  console.log("================================================================================");
  console.log("TEST USER SEEDING SCRIPT");
  console.log("================================================================================\n");
  console.log("USAGE:");
  console.log("  Seed test users:");
  console.log("    EXISTING_ADMIN_EMAIL=admin@example.com EXISTING_ADMIN_PASSWORD=Pass \\");
  console.log("      node scripts/seedTestUsers.js --with-existing-admin\n");
  console.log("  Remove test users:");
  console.log("    EXISTING_ADMIN_EMAIL=admin@example.com EXISTING_ADMIN_PASSWORD=Pass \\");
  console.log("      node scripts/seedTestUsers.js --clean --with-existing-admin\n");
  console.log("NOTES:");
  console.log("  - Test users have emails ending in: " + TEST_EMAIL_DOMAIN);
  console.log("  - Only these users will be deleted during --clean");
  console.log("  - The admin used for cleanup will NOT be deleted\n");
  console.log("================================================================================\n");
}

// Parse arguments
const args = process.argv.slice(2);
const hasCleanFlag = args.includes("--clean");
const hasAdminFlag = args.includes("--with-existing-admin");

if (hasAdminFlag) {
  if (hasCleanFlag) {
    cleanTestUsers().catch(function(error) {
      console.error("Failed:", error.message);
      process.exit(1);
    });
  } else {
    seedWithExistingAdmin().catch(function(error) {
      console.error("Failed:", error.message);
      process.exit(1);
    });
  }
} else {
  printInstructions();
}