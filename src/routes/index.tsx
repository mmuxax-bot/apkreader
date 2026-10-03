import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "APK Studio — saytınızı Android tətbiqinə çevirin" },
      {
        name: "description",
        content:
          "Sayt linkini və ya statik ZIP-i verin, “Layihəni APK-ya çevir” düyməsinə basın — APK Studio Android tətbiqini yığıb yükləmə linki versin.",
      },
    ],
  }),
  component: Landing,
});
