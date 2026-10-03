import { createFileRoute } from "@tanstack/react-router";
import { handleStart } from "@/lib/apk/service.server";

export const Route = createFileRoute("/api/apk/start")({
  server: {
    handlers: {
      POST: ({ request }) => handleStart(request),
    },
  },
});
