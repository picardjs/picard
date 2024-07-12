import { h } from 'preact';
import CompactHeader from './components/CompactHeader';
import Button from './components/Button';
import { getLifecycle } from './js/utils';

const Checkout = () => {
  return (
    <div data-boundary-page="checkout">
      <CompactHeader />
      <main class="c_Checkout">
        <h2>Checkout</h2>
        <form action="/checkout/place-order" method="post" class="c_Checkout__form">
          <h3>Personal Data</h3>
          <fieldset class="c_Checkout__name">
            <div>
              <label class="c_Checkout__label" for="c_firstname">
                First name
              </label>
              <input class="c_Checkout__input" type="text" id="c_firstname" name="firstname" required />
            </div>
            <div>
              <label class="c_Checkout__label" for="c_lastname">
                Last name
              </label>
              <input class="c_Checkout__input" type="text" id="c_lastname" name="lastname" required />
            </div>
          </fieldset>

          <h3>Store Pickup</h3>
          <fieldset>
            <div class="c_Checkout__store">
              <pi-component name="StorePicker" source="explore" />
            </div>
            <label class="c_Checkout__label" for="c_storeId">
              Store ID
            </label>
            <input class="c_Checkout__input" type="text" id="c_storeId" name="storeId" readonly required />
          </fieldset>

          <div class="c_Checkout__buttons">
            <Button type="submit" variant="primary" disabled>
              place order
            </Button>
            <Button href="/checkout/cart" variant="secondary" disabled>
              back to cart
            </Button>
          </div>
        </form>
      </main>
      <pi-slot name="Footer" />
    </div>
  );
};

export default getLifecycle(Checkout);
