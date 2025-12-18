"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });
import "swagger-ui-react/swagger-ui.css";

export default function APIDocsPage() {
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    fetch("/api/docs/v1")
      .then((res) => res.json())
      .then((data) => setSpec(data));
  }, []);

  if (!spec) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">API Documentation</h1>
        <p>Loading API documentation...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">API Documentation v1</h1>
        <SwaggerUI spec={spec} />
      </div>
    </div>
  );
}

