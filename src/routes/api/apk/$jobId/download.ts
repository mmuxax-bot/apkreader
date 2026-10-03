import { createFileRoute } from "@tanstack/react-router";
import { handleDownload } from "@/lib/apk/service.server";

export const Route = createFileRoute("/api/apk/$jobId/download")({
  server: {
    handlers: {
      GET: ({ request, params }) => handleDownload(request, params.jobId),
    },
  },
});
