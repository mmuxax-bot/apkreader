import { createFileRoute } from "@tanstack/react-router";
import { handleChunk } from "@/lib/apk/service.server";

export const Route = createFileRoute("/api/apk/chunk")({
  server: {
    handlers: {
      POST: ({ request }) => handleChunk(request),
    },
  },
});
