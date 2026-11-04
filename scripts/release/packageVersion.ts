const VERSION_FIELD = /"version": "[^"]*"/;

export function withPackageVersion(manifest: string, version: string): string {
  if (!VERSION_FIELD.test(manifest)) {
    throw new Error('package.json has no version field');
  }
  return manifest.replace(VERSION_FIELD, `"version": "${version}"`);
}
