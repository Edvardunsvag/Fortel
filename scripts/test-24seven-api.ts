/**
 * Test script for 24SevenOffice SOAP API
 *
 * Run with: npx tsx scripts/test-24seven-api.ts
 *
 * Required environment variables in .env.local:
 * - TWENTYFOUR_SEVEN_APP_ID
 * - TWENTYFOUR_SEVEN_USERNAME
 * - TWENTYFOUR_SEVEN_PASSWORD
 */

import * as soap from "soap";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

// Configuration
const AUTH_WSDL = "https://api.24sevenoffice.com/authenticate/v001/authenticate.asmx?wsdl";
const TIME_WSDL = "https://webservices.24sevenoffice.com/timesheet/v001/timeservice.asmx?wsdl";

// You can either:
// 1. Use API credentials (ApplicationId, Username, Password)
// 2. OR just paste a session ID from browser cookies (easier for testing!)
const credentials = {
  ApplicationId: process.env.TWENTYFOUR_SEVEN_APP_ID,
  Username: process.env.TWENTYFOUR_SEVEN_USERNAME,
  Password: process.env.TWENTYFOUR_SEVEN_PASSWORD,
};

// Session ID stolen from browser cookies (use this for quick testing!)
const BROWSER_SESSION_ID = process.env.TWENTYFOUR_SEVEN_SESSION_ID;

// Check if we have a browser session or need to authenticate
function hasValidConfig(): "browser_session" | "api_credentials" | null {
  if (BROWSER_SESSION_ID) {
    return "browser_session";
  }
  if (credentials.ApplicationId && credentials.Username && credentials.Password) {
    return "api_credentials";
  }
  return null;
}

// Store session ID globally
let sessionId: string | null = null;

/**
 * Authenticate and get session ID
 */
async function authenticate(): Promise<string> {
  console.log("\n=== Authenticating with 24SevenOffice ===");
  console.log(`Username: ${credentials.Username}`);

  const client = await soap.createClientAsync(AUTH_WSDL);

  const result = await client.LoginAsync({
    credential: {
      ApplicationId: credentials.ApplicationId,
      Username: credentials.Username,
      Password: credentials.Password,
    },
  });

  const loginResult = result[0]?.LoginResult;

  if (!loginResult) {
    throw new Error("Login failed - no session ID returned");
  }

  console.log(`Session ID obtained: ${loginResult.substring(0, 20)}...`);
  return loginResult;
}

/**
 * Create a SOAP client with session cookie
 */
async function createTimeClient(): Promise<soap.Client> {
  if (!sessionId) {
    throw new Error("Not authenticated - call authenticate() first");
  }

  const client = await soap.createClientAsync(TIME_WSDL);

  // Add session cookie to requests
  client.addHttpHeader("Cookie", `ASP.NET_SessionId=${sessionId}`);

  return client;
}

/**
 * Test: Get time settings
 */
async function testGetTimeSettings(): Promise<void> {
  console.log("\n=== Testing GetTimeSettings ===");

  try {
    const client = await createTimeClient();
    const result = await client.GetTimeSettingsAsync({});

    console.log("TimeSettings result:");
    console.log(JSON.stringify(result[0], null, 2));
  } catch (error) {
    console.error("GetTimeSettings failed:", error instanceof Error ? error.message : error);
  }
}

/**
 * Test: Get work type list
 */
async function testGetWorkTypeList(): Promise<void> {
  console.log("\n=== Testing GetWorkTypeList ===");

  try {
    const client = await createTimeClient();
    const result = await client.GetWorkTypeListAsync({
      showInactive: false,
    });

    console.log("WorkTypeList result:");
    const workTypes = result[0]?.GetWorkTypeListResult?.WorkType || [];
    console.log(`Found ${Array.isArray(workTypes) ? workTypes.length : 1} work types`);

    // Show first few
    const typesToShow = Array.isArray(workTypes) ? workTypes.slice(0, 5) : [workTypes];
    typesToShow.forEach((wt: any) => {
      console.log(`  - ${wt.Name} (ID: ${wt.TypeId})`);
    });
  } catch (error) {
    console.error("GetWorkTypeList failed:", error instanceof Error ? error.message : error);
  }
}

/**
 * Test: Get project list
 */
async function testGetProjectList(): Promise<void> {
  console.log("\n=== Testing GetProjectList ===");

  try {
    const client = await createTimeClient();
    const result = await client.GetProjectListAsync({});

    console.log("ProjectList result:");
    const projects = result[0]?.GetProjectListResult?.ProjectInfo || [];
    console.log(`Found ${Array.isArray(projects) ? projects.length : 1} projects`);

    // Show first few
    const projectsToShow = Array.isArray(projects) ? projects.slice(0, 5) : [projects];
    projectsToShow.forEach((p: any) => {
      console.log(`  - ${p.Name} (ID: ${p.ProjectId})`);
    });
  } catch (error) {
    console.error("GetProjectList failed:", error instanceof Error ? error.message : error);
  }
}

/**
 * Test: Get hours
 */
async function testGetHours(): Promise<void> {
  console.log("\n=== Testing GetHours ===");

  try {
    const client = await createTimeClient();

    // Search for hours in the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const searchParams = {
      DateStart: startDate.toISOString(),
      DateEnd: endDate.toISOString(),
    };

    console.log(`Searching hours from ${startDate.toDateString()} to ${endDate.toDateString()}`);

    const result = await client.GetHoursAsync({
      searchParams,
    });

    console.log("GetHours result:");
    const hours = result[0]?.GetHoursResult?.Hour || [];
    const hourArray = Array.isArray(hours) ? hours : hours ? [hours] : [];

    console.log(`Found ${hourArray.length} hour entries`);

    if (hourArray.length > 0) {
      console.log("\nFirst entry structure:");
      console.log(JSON.stringify(hourArray[0], null, 2));

      // Summarize hours
      let totalHours = 0;
      hourArray.forEach((h: any) => {
        totalHours += parseFloat(h.TotalHours || 0);
      });
      console.log(`\nTotal hours in period: ${totalHours.toFixed(2)}`);
    }
  } catch (error) {
    console.error("GetHours failed:", error instanceof Error ? error.message : error);
  }
}

/**
 * Test: Get hour list (just IDs)
 */
async function testGetHourList(): Promise<void> {
  console.log("\n=== Testing GetHourList ===");

  try {
    const client = await createTimeClient();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const result = await client.GetHourListAsync({
      searchParams: {
        DateStart: startDate.toISOString(),
        DateEnd: endDate.toISOString(),
      },
    });

    console.log("GetHourList result:");
    const hourIds = result[0]?.GetHourListResult?.int || [];
    const idArray = Array.isArray(hourIds) ? hourIds : hourIds ? [hourIds] : [];
    console.log(`Found ${idArray.length} hour entry IDs`);

    if (idArray.length > 0) {
      console.log(`First few IDs: ${idArray.slice(0, 5).join(", ")}`);
    }
  } catch (error) {
    console.error("GetHourList failed:", error instanceof Error ? error.message : error);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log("==============================================");
  console.log("  24SevenOffice API Test Script");
  console.log("==============================================");

  const configType = hasValidConfig();

  if (!configType) {
    console.log("\nNo valid configuration found. You have two options:\n");
    console.log("OPTION 1 - Browser Session (easiest for testing):");
    console.log("  1. Log in to 24SevenOffice in your browser");
    console.log("  2. Open DevTools (F12) > Application > Cookies");
    console.log("  3. Find ASP.NET_SessionId cookie");
    console.log("  4. Add to .env.local: TWENTYFOUR_SEVEN_SESSION_ID=<value>\n");
    console.log("OPTION 2 - API Credentials:");
    console.log("  TWENTYFOUR_SEVEN_APP_ID=<your-app-id>");
    console.log("  TWENTYFOUR_SEVEN_USERNAME=<your-email>");
    console.log("  TWENTYFOUR_SEVEN_PASSWORD=<your-password>");
    console.log("\n  (To get an ApplicationId, email support@24sevenoffice.com)");
    process.exit(1);
  }

  try {
    // Step 1: Get session (either from browser or authenticate)
    if (configType === "browser_session") {
      console.log("\nUsing browser session ID from .env.local");
      sessionId = BROWSER_SESSION_ID!;
    } else {
      sessionId = await authenticate();
    }

    // Step 2: Test various endpoints
    await testGetTimeSettings();
    await testGetWorkTypeList();
    await testGetProjectList();
    await testGetHourList();
    await testGetHours();

    console.log("\n==============================================");
    console.log("  All tests completed!");
    console.log("==============================================");
  } catch (error) {
    console.error("\nFatal error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
