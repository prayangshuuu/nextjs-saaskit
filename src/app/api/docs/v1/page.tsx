"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });
import "swagger-ui-react/swagger-ui.css";

const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Next.js SaaS Kit API",
    version: "1.0.0",
    description: "Production-ready SaaS starter kit REST API documentation",
  },
  servers: [
    {
      url: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
      description: "Current server",
    },
  ],
  paths: {
    "/api/v1/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  name: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User created successfully",
          },
          "400": {
            description: "Validation error",
          },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
          },
          "401": {
            description: "Invalid credentials",
          },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Logout and invalidate sessions",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Logout successful",
          },
          "401": {
            description: "Unauthorized",
          },
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current user information",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "User information",
          },
          "401": {
            description: "Unauthorized",
          },
        },
      },
    },
    "/api/v1/plans": {
      get: {
        tags: ["Billing"],
        summary: "Get all active subscription plans",
        responses: {
          "200": {
            description: "List of active plans",
          },
        },
      },
    },
    "/api/v1/subscriptions": {
      post: {
        tags: ["Billing"],
        summary: "Subscribe to a plan",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  planId: { type: "string" },
                },
                required: ["planId"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Subscription created",
          },
          "400": {
            description: "Validation error or duplicate subscription",
          },
        },
      },
      get: {
        tags: ["Billing"],
        summary: "Get user's subscriptions",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of user subscriptions",
          },
        },
      },
    },
    "/api/v1/admin/plans": {
      get: {
        tags: ["Admin"],
        summary: "Get all plans (Admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of all plans",
          },
          "403": {
            description: "Forbidden - Admin access required",
          },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Create a new plan (Admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  price: { type: "number" },
                  interval: { type: "string", enum: ["MONTHLY", "YEARLY"] },
                  features: { type: "array", items: { type: "string" } },
                  active: { type: "boolean" },
                },
                required: ["name", "price", "interval"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Plan created",
          },
          "403": {
            description: "Forbidden - Admin access required",
          },
        },
      },
    },
    "/api/v1/admin/payments/providers": {
      get: {
        tags: ["Admin"],
        summary: "Get all payment providers (Admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of payment providers",
          },
          "403": {
            description: "Forbidden - Admin access required",
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  tags: [
    {
      name: "Authentication",
      description: "User authentication endpoints",
    },
    {
      name: "Billing",
      description: "Subscription and billing endpoints",
    },
    {
      name: "Admin",
      description: "Admin-only endpoints (require ADMIN role)",
    },
  ],
};

export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">API Documentation v1</h1>
        <SwaggerUI spec={openApiSpec} />
      </div>
    </div>
  );
}

