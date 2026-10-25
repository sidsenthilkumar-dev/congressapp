// Keep browser checks separate from the normal Vite development port.
export const testPort = Number(process.env.REBOUND_TEST_PORT || 5180);
if (!Number.isInteger(testPort) || testPort < 1024 || testPort > 65535)
  throw Error("REBOUND_TEST_PORT must be an integer from 1024 to 65535.");
export const testOrigin = `http://localhost:${testPort}`;
