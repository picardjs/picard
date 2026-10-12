declare module 'embedded:*' {
  /**
   * The files of the embedded app, mapping each file name to its content.
   */
  const files: Record<string, string>;
  export default files;
}
