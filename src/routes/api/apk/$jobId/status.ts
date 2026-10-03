import { createFileRoute } from "@tanstack/react-router";
import { handleStatus } from "@/lib/apk/service.server";

export const Route = createFileRoute("/api/apk/$jobId/status")({
  server: {
    handlers: {
      GET: ({ request, params }) => handleStatus(request, params.jobId),
    },
  },
});
