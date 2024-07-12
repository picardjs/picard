import { h } from 'preact';
import data from './data/db.json';
import Button from './components/Button';
import { getLifecycle } from './js/utils';

const AddToCart = ({ sku }) => {
  const variant = data.variants.find((p) => p.sku === sku);
  const outOfStock = variant.inventory === 0;

  return (
    <form action="/checkout/cart/add" method="POST" class="c_AddToCart" data-boundary="checkout">
      <input type="hidden" name="sku" value={sku} />
      <div class="c_AddToCart__information">
        <p>{variant.price} Ø</p>
        {variant.inventory > 0 ? (
          <p class="c_AddToCart__stock c_AddToCart__stock--ok">{variant.inventory} in stock, free shipping</p>
        ) : (
          <p class="c_AddToCart__stock c_AddToCart__stock--empty">out of stock</p>
        )}
      </div>
      <Button disabled={outOfStock} className="c_AddToCart__button" variant="primary">
        add to basket
      </Button>
      <div class="c_AddToCart__confirmed c_AddToCart__confirmed--hidden">
        <p>Tractor was added.</p>
        <a href="/checkout/cart" class="c_AddToCart__link">
          View in basket.
        </a>
      </div>
    </form>
  );
};

export default getLifecycle(AddToCart);
