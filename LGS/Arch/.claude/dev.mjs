// Локальный запуск dev-сервера без записи настроек телеметрии Next.js
import { spawn } from "node:child_process";
process.env.NEXT_TELEMETRY_DISABLED = "1";
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", "3000"], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 0));
