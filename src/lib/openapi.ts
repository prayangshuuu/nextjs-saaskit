/**
 * OpenAPI Specification Generator
 * 
 * MIT License
 * Copyright (c) 2025 Prayangshu Biswas
 */

import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Next.js SaaS Kit API",
      version: "1.0.0",
      description: "REST API for Next.js SaaS Kit - A production-ready SaaS starter kit",
      contact: {
        name: "API Support",
        url: "https://github.com/prayangshuuu/nextjs-saaskit",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        description: "API Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
        cookieAuth: [],
      },
    ],
    tags: [
      { name: "Authentication", description: "User authentication endpoints" },
      { name: "Users", description: "User management endpoints" },
      { name: "Admin", description: "Admin-only endpoints" },
      { name: "Billing", description: "Billing and subscription endpoints" },
      { name: "Settings", description: "System settings endpoints" },
      { name: "Files", description: "File upload endpoints" },
      { name: "OAuth", description: "OAuth social login endpoints" },
      { name: "2FA", description: "Two-factor authentication endpoints" },
    ],
  },
  apis: [
    "./src/app/api/v1/**/*.ts",
    "./src/app/api/v1/**/route.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

