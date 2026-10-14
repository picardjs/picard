import { test, expect } from '@playwright/test';
import { createDecorator } from '../src/common/server/decorator';

function createInjector(loadComponents: (name: string, opts: any) => Promise<Array<any>>) {
  const services: Record<string, any> = {
    config: { componentName: 'pi-component', slotName: 'pi-slot', partName: 'pi-part' },
    scope: { loadComponents },
    renderer: { render: () => undefined },
  };
  return { get: (name: string) => services[name] } as any;
}

test('passes the documented ordering attributes of a pi-slot', async () => {
  const calls: Array<any> = [];
  const decorator = createDecorator(
    createInjector(async (name, opts) => {
      calls.push(opts);
      return [];
    }),
  );

  await decorator.decorate('<pi-slot name="item" order-by="origin" reverse-order></pi-slot>');

  expect(calls).toEqual([{ orderBy: 'origin', reverse: true }]);
});
