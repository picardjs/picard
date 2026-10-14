import { test, expect } from '@playwright/test';
import { fromDiscovery } from '../src/common/feed/discovery';

test('infers the format of discovery entries without a pilet section', () => {
  const [mf, nf, fallback] = fromDiscovery({
    schema: 'https://mfewg.org/schema/v1-pre.json',
    microFrontends: {
      mf: [{ url: 'https://picard.test/mf/remoteEntry.js', metadata: {}, extras: { modulefederation: {}, id: 'mf' } }],
      nf: [{ url: 'https://picard.test/nf/remoteEntry.json', metadata: {}, extras: { nativefederation: {} } }],
      plain: [{ url: 'https://picard.test/plain/remoteEntry.js', metadata: {} }],
    },
  } as any);

  expect(mf.format).toBe('module');
  expect(nf.format).toBe('native');
  expect(fallback.format).toBe('module');
});

test('infers the format of discovery entries from the pilet spec', () => {
  const [mf, nf, pilet] = fromDiscovery({
    schema: 'https://mfewg.org/schema/v1-pre.json',
    microFrontends: {
      mf: [{ url: 'https://picard.test/mf/remoteEntry.js', metadata: {}, extras: { pilet: { spec: 'mf' } } }],
      nf: [{ url: 'https://picard.test/nf/remoteEntry.json', metadata: {}, extras: { pilet: { spec: 'nf' } } }],
      pilet: [
        { url: 'https://picard.test/pilet/index.js', metadata: { version: '1.0.0' }, extras: { pilet: { spec: 'v2' } } },
      ],
    },
  } as any);

  expect(mf.format).toBe('module');
  expect(nf.format).toBe('native');
  expect(pilet.format).toBe('pilet');
});
