import swaggerJsdoc from "swagger-jsdoc";

const projectId = process.env.PROJECT_ID || process.env.GCLOUD_PROJECT;
const region = process.env.APP_REGION || "asia-southeast1";

export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: process.env.API_TITLE || "Alegria Booking System API",
      version: process.env.API_VERSION || "1.0.0",
      description: process.env.API_DESCRIPTION || "API documentation for the Alegria Booking System",
    },
    servers: [
      projectId ? { url: `http://localhost:5001/${projectId}/${region}/api`, description: "Local Emulator" } : undefined,
      projectId ? { url: `https://api-${projectId}.${region}.a.run.app`, description: "Production" } : undefined,
    ].filter(Boolean),
  },
  // Scan only routes to avoid duplicate docs from legacy files
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions as any);
