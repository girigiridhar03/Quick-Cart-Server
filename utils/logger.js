import chalk from "chalk";

const time = () => {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};
const getCallerInfo = (msg) => {
  const stack = (msg instanceof Error ? msg.stack : new Error().stack).split(
    "\n",
  );

  const callerLine =
    stack.find(
      (line) =>
        !line.includes("logger.js") &&
        !line.includes("handler.js") &&
        !line.includes("node_modules") &&
        line.includes("file://"),
    ) || "";

  const match =
    callerLine.match(/\((.+):(\d+):(\d+)\)/) ||
    callerLine.match(/at (.+):(\d+):(\d+)/);
  if (!match) return "";
  const filePath = match[1].replace(process.cwd(), "");
  return `${filePath}:${match[2]}`;
};

const log = (color, icon, msg, meta = {}) => {
  const caller = getCallerInfo(msg); // 👈 pass msg here
  const text = msg instanceof Error ? msg.message : msg;
  console.log(
    color.bold(`${icon} [${time()}] ${text}`) + chalk.gray(` (${caller})`),
  );
  if (Object.keys(meta).length) {
    console.log(color(`   →`, JSON.stringify(meta)));
  }
};

const logger = {
  success: (msg, meta = {}) => log(chalk.green, "✅", msg, meta),
  error: (msg, meta = {}) => log(chalk.red, "❌", msg, meta),
  warn: (msg, meta = {}) => log(chalk.yellow, "⚠️ ", msg, meta),
  info: (msg, meta = {}) => log(chalk.blue, "ℹ️ ", msg, meta),
  db: (msg, meta = {}) => log(chalk.cyan, "🗄️ ", msg, meta),
  ai: (msg, meta = {}) => log(chalk.magenta, "🤖", msg, meta),
};

export default logger;
