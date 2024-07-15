export function defer(cb: () => void): void {
  setTimeout(cb, 0);
}
