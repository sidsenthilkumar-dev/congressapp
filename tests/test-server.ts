export const testPort = Number(process.env.REBOUND_TEST_PORT || 5173);
if (!Number.isInteger(testPort) || testPort < 1024 || testPort > 65535)
  throw Error("REBOUND_TEST_PORT must be an integer from 1024 to 65535.");
export const testOrigin = `http://localhost:${testPort}`;
