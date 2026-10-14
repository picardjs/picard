import * as vm from 'node:vm';

export function defer(cb: () => void): void {
  setTimeout(cb, 0);
}

/**
 * Gets the constructors for ES modules in a VM context. Only available if
 * Node.js runs with the `--experimental-vm-modules` flag. Not imported by
 * name to keep the module working (e.g., for scripts) without the flag.
 */
export function getVmModules(): Pick<typeof vm, 'SourceTextModule' | 'SyntheticModule'> {
  const { SourceTextModule, SyntheticModule } = vm;

  if (typeof SourceTextModule !== 'function' || typeof SyntheticModule !== 'function') {
    throw new Error('Loading ES modules requires running Node.js with the "--experimental-vm-modules" flag.');
  }

  return { SourceTextModule, SyntheticModule };
}
