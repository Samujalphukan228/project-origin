import gradient from "gradient-string";
import http from "http";
import { setupSocket } from "./src/configs/socket.js";
import app from "./app.js";

const server = http.createServer(app);
const io = setupSocket(server);
app.set("io", io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  const blueWhite = gradient(["#1e3a8a", "#3b82f6", "#93c5fd", "#ffffff"]);
  const lightBlue = gradient(["#60a5fa", "#dbeafe"]);

  console.clear();
  console.log("\n");
  console.log(blueWhite("  PROJECT ORIGIN"));
  console.log(lightBlue("  ───────────────"));
  console.log(`\n  Server running on port ${PORT}`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`\n  ${lightBlue("● Ready")}\n`);
});
