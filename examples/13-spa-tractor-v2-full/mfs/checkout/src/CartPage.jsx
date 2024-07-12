import { h } from 'preact';
import LineItem from './components/LineItem';
import Button from './components/Button';
import data from './data/db.json';
import { getLifecycle } from './js/utils';

function convertToLineItems(items) {
  return items.reduce((res, { sku, quantity }) => {
    const variant = data.variants.find((p) => p.sku === sku);
    if (variant) {
      res.push({ ...variant, quantity, total: variant.price * quantity });
    }
    return res;
  }, []);
}

const CartPage = () => {
  const cookieLineItems = [];//TODO
  const lineItems = convertToLineItems(cookieLineItems);
  const total = lineItems.reduce((res, { total }) => res + total, 0);
  const skus = lineItems.map(({ sku }) => sku);

  return (
    <div data-boundary-page="checkout">
      <pi-slot name="Header" />
      <main class="c_CartPage">
        <h2>Basket</h2>
        <ul class="c_CartPage__lineItems">
          {lineItems.map((li) => (
            <LineItem {...li} />
          ))}
        </ul>
        <hr />
        <p class="c_CartPage__total">Total: {total} Ø</p>
        <div class="c_CartPage__buttons">
          <Button href="/checkout/checkout" variant="primary">
            Checkout
          </Button>
          <Button href="/" variant="secondary">
            Continue Shopping
          </Button>
        </div>
        <pi-component name="Recommendations" source="explore" data={{ skus }} />
      </main>
      <pi-slot name="Footer" />
    </div>
  );
};

export default getLifecycle(CartPage);
