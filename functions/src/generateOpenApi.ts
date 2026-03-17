import swaggerAutogen from "swagger-autogen";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../.env") });

const getFirebaseConfig = () => {
  let projectId = process.env.PROJECT_ID || process.env.GCLOUD_PROJECT;
  const region = process.env.APP_REGION || "asia-southeast1";

  if (!projectId) {
    try {
      const firebasercPath = path.join(__dirname, "../../.firebaserc");
      if (fs.existsSync(firebasercPath)) {
        const rc = JSON.parse(fs.readFileSync(firebasercPath, "utf-8"));
        projectId = rc.projects?.default;
      }
    } catch (e) {
      console.warn("Could not read .firebaserc");
    }
  }

  return { projectId, region };
};

const { projectId, region } = getFirebaseConfig();

if (!projectId) {
  console.error("Error: Could not determine Project ID. Run 'firebase use <project>' or set GCLOUD_PROJECT.");
  process.exit(1);
}

const doc = {
  info: {
    title: process.env.API_TITLE || "Alegria Booking System API",
    version: process.env.API_VERSION || "1.0.1",
    description: process.env.API_DESCRIPTION || "API documentation for the Alegria Booking System",
  },
  servers: [
    { url: `http://localhost:5001/${projectId}/${region}/api`, description: "Local Emulator" },
    { url: `https://${region}-${projectId}.cloudfunctions.net/api`, description: "Production" },
  ],
  tags: [
    { name: "Auth", description: "Authentication" },
    {name: "Analytics", description: "Analytics for operator" },
    { name: "Bookings", description: "Booking management" },
    { name: "Entities", description: "Business partner entities management" },
    { name: "Voucher Codes", description: "Promo/discount code management" },
    { name: "Database", description: "Database management" },
    { name: "Health", description: "Health check" },
  ],
};

// swagger-entry.js uses plain CommonJS require() calls so swagger-autogen's
// static analysis can follow the require() chain to each route file.
// (The compiled app.js wraps requires in __importDefault which swagger-autogen cannot trace.)
const outputFile = path.join(__dirname, "../openapi.json");
const routes = [path.join(__dirname, "../swagger-entry.js")];

swaggerAutogen({ openapi: "3.0.0" })(outputFile, routes, doc);
