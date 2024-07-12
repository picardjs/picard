import { h } from 'preact';
import Button from './components/Button';
import { getLifecycle } from './js/utils';

const Thanks = () => {
  return (
    <div data-boundary-page="checkout">
      <pi-slot name="Header" />
      <main class="c_Thanks">
        <h2 class="c_Thanks__title">Thanks for your order!</h2>
        <p class="c_Thanks__text">We'll notify you, when its ready for pickup.</p>
        <Button href="/" variant="secondary">
          Continue Shopping
        </Button>
      </main>
      <pi-slot name="Footer" />
    </div>
  );
};

export default getLifecycle(Thanks);
