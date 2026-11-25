// src/shared/config/app.ts

export const APP_NAME = "KinsorBoard";
export const APP_DESCRIPTION =
  "An interactive spatial canvas and whiteboard for sketching, notes, and visual ideas.";

export const APP_VERSION =
  typeof __APP_VERSION__ !== "undefined"
    ? `v${__APP_VERSION__}`
    : "v0.1.0-alpha";

export const APP_LINKS = {
  repo: "https://github.com/Mr-Kinako/kinsorboard",
  issues: "https://github.com/Mr-Kinako/kinsorboard/issues",
  docs: "https://github.com/Mr-Kinako/kinsorboard#readme",
} as const;
