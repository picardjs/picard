import type { LoadingQueue } from '@/types';

export function createNewQueue() {
  const queue: LoadingQueue = {
    current: Promise.resolve(),
    async enqueue(cb) {
      const next = queue.current.then(cb);
      queue.current = next.then(() => {});
      return await next;
    },
    depends(cb) {
      return queue.current.then(cb);
    },
  };

  return queue;
}
