import swaggerJsdoc from "swagger-jsdoc";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config({path: path.join(__dirname, "../.env")});

const getFirebaseConfig = () => {
  // 1. Try environment variables (highest priority)
  let projectId = process.env.PROJECT_ID || process.env.GCLOUD_PROJECT;
  const region = process.env.APP_REGION || "asia-southeast1";

  // 2. Try reading .firebaserc if projectId is not set
  if (!projectId) {
    try {
      const firebasercPath = path.join(__dirname, "../../.firebaserc");
      if (fs.existsSync(firebasercPath)) {
        const rc = JSON.parse(fs.readFileSync(firebasercPath, "utf-8"));
        projectId = rc.projects?.default;
      }
    } catch (e) {
      console.warn("Could not read .firebaserc, falling back to defaults.");
    }
  }

  return {
    projectId: projectId, // No hardcoded fallback
    region: region
  };
};

const {projectId, region} = getFirebaseConfig();

if (!projectId) {
  console.error("Error: Could not determine Project ID. Please run 'firebase use <project>' or set GCLOUD_PROJECT.");
  process.exit(1);
}

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: process.env.API_TITLE || "Alegria Booking System API",
      version: process.env.API_VERSION || "1.0.0",
      description: process.env.API_DESCRIPTION || "API documentation for the Alegria Booking System",
    },
    servers: [
      {
        url: `http://localhost:5001/${projectId}/${region}/api`,
        description: "Local Emulator",
      },
      {
        url: `https://api-${projectId}.${region}.a.run.app`,
        description: "Production",
      }
    ],
  },
  // Scan route files plus selected root files for additional endpoints
  apis: [
    path.join(__dirname, "./routes/*.ts"),
    path.join(__dirname, "./app.ts"),
    path.join(__dirname, "./initDb.ts"),
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const outputPath = path.join(__dirname, "../openapi.json");
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));

console.log(`OpenAPI specification generated at: ${outputPath}`);
