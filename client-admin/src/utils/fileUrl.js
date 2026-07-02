/**
 * Get the correct URL for uploaded files/images.
 * In production under /vms subdirectory, prepends /vms/.
 * In development, serves from root /.
 */
export function getFileUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return import.meta.env.DEV ? `/${cleanPath}` : `/vms/${cleanPath}`;
}
