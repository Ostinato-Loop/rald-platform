import app from "./app";
import { logger } from "./lib/logger";
import { startEventBus, stopEventBus } from "./lib/eventBus";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  startEventBus();
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received — shutting down gracefully");
  stopEventBus();
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  stopEventBus();
  server.close(() => process.exit(0));
});
