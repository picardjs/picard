import { h } from 'preact';
import Navigation from './components/Navigation';
import { getLifecycle } from './js/utils';

const Header = () => {
  return (
    <header class="e_Header" data-boundary="explore">
      <div class="e_Header__cutter">
        <div class="e_Header__inner">
          <a class="e_Header__link" href="/">
            <img
              class="e_Header__logo"
              src="https://blueprint.the-tractor.store/cdn/img/logo.svg"
              alt="Micro Frontends - Tractor Store"
            />
          </a>
          <div class="e_Header__navigation">
            <Navigation />
          </div>
          <div class="e_Header__cart">
            <pi-component name="MiniCart" source="checkout" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default getLifecycle(Header);
