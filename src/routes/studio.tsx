import { createFileRoute } from "@tanstack/react-router";
import { ApkStudio } from "@/components/apk-studio";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "APK düzəlt — APK Studio" },
      {
        name: "description",
        content: "Sayt ünvanı və ya ZIP yükləyin, “APK düzəlt” düyməsinə basın və hazır APK linkini alın.",
      },
    ],
  }),
  component: ApkStudio,
});
