export interface LoadingQueue {
  /**
   * The current promise.
   */
  current: Promise<void>;
  /**
   * Depends on the current promise, but also replaces it to
   * move it forward.
   * @param cb The callback to enqueue to run after the promise resolved.
   */
  enqueue<T>(cb: () => Promise<T> | T): Promise<T>;
  /**
   * Depends only on the current promise - does not shift it.
   * @param cb The callback to run after the promise resolved.
   */
  depends<T>(cb: () => Promise<T> | T): Promise<T>;
}

export type Dispose = () => void;
