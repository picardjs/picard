import { h } from 'preact';
import { getLifecycle } from './js/utils';

const Footer = () => {
  return (
    <footer class="e_Footer" data-boundary="explore">
      <div class="e_Footer__cutter">
        <div class="e_Footer__inner">
          <div class="e_Footer__initiative">
            <img
              src="https://blueprint.the-tractor.store/cdn/img/neulandlogo.svg"
              alt="neuland - Büro für Informatik"
              width="45"
              height="40"
            />
            <p>
              based on{' '}
              <a href="https://micro-frontends.org/tractor-store/" target="_blank">
                the tractor store 2.0
              </a>
              <br />a{' '}
              <a href="https://neuland-bfi.de" target="_blank">
                neuland
              </a>{' '}
              project
            </p>
          </div>

          <div class="e_Footer__credits">
            <h3>techstack</h3>
            <p>SPA, Native Federation, Picard.js, Preact, esbuild</p>
            <p>
              build by <img src="https://picard.js.org/picard-logo-mini.png" alt="Picard.js" width="14" height="14" />
              <a href="https://picard.js.org" target="_blank">
                Picard.js
              </a>{' '}
              /{' '}
              <a href="https://github.com/picardjs/picard/tree/develop/examples/13-spa-tractor-v2-full" target="_blank">
                GitHub
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default getLifecycle(Footer);
