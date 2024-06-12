export interface LoadingQueue {
  current: Promise<void>;
  enqueue<T>(cb: () => Promise<T> | T): Promise<T>;
}
