// pi extension adapter for the shared secret-leak-guard core.
//
// Wires pi's `tool_call` event for the `bash` and `read` tools to the shared core.
// On a deny it returns {block: true, reason}; the reason (with its safe alternative)
// goes back to the model. The rule logic lives entirely in the core.
//
// FAIL-OPEN: if the core cannot be imported, the handler is not registered and pi
// runs without the guard (a broken guard degrades to allow, operator decision).
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { checkBash, checkRead } from "../core/rules.mjs";

export { checkBash, checkRead };

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "bash") {
      const input = (event.input ?? {}) as Record<string, unknown>;
      const command = typeof input.command === "string" ? input.command : "";
      const reason = checkBash(command);
      if (reason) return { block: true, reason };
    } else if (event.toolName === "read") {
      const input = (event.input ?? {}) as Record<string, unknown>;
      const path = typeof (input.path ?? input.file_path) === "string"
        ? String(input.path ?? input.file_path)
        : "";
      const reason = checkRead(path);
      if (reason) return { block: true, reason };
    }
  });
}
