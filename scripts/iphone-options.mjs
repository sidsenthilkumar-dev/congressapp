export function iphoneTarget(args, env = process.env) {
  const lan = args.includes("--lan-web");
  if (lan && args.includes("--https"))
    throw Error(
      "Choose HTTPS camera preview or --lan-web screen preview, not both.",
    );
  if (env.REBOUND_APP_URL) {
    const url = new URL(env.REBOUND_APP_URL);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(url.pathname)
    )
      throw Error(
        "REBOUND_APP_URL must be a clean HTTPS Rebound address, with a trailing slash for a project path.",
      );
    if (lan)
      throw Error("A hosted app address cannot be combined with --lan-web.");
    return { mode: "hosted", url: url.href };
  }
  return { mode: lan ? "lan" : "https", url: null };
}
