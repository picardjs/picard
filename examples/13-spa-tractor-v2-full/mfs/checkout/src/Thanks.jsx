import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import confetti from 'canvas-confetti';
import Button from './components/Button';
import { getLifecycle } from './js/utils';

const settings = {
  particleCount: 3,
  scalar: 1.5,
  colors: ['#FFDE54', '#FF5A54', '#54FF90'],
  spread: 70,
};

function useConfetti() {
  useEffect(() => {
    const end = Date.now() + 1000;

    function frame() {
      confetti({
        ...settings,
        angle: 60,
        origin: { x: 0 },
      });
      confetti({
        ...settings,
        angle: 120,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        window.requestAnimationFrame(frame);
      }
    }

    frame();
  }, []);
}

const Thanks = () => {
  useConfetti();

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
