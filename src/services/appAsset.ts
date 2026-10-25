/** Resolve public assets beneath either a root deployment or a project Pages path. */
export function appAsset(path: string) {
  return import.meta.env.BASE_URL + path.replace(/^\/+/, "");
}
