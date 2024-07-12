import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import CompactHeader from './components/CompactHeader';
import Button from './components/Button';
import { getLifecycle } from './js/utils';

function useShop() {
  const [shop, setShop] = useState('');

  useEffect(() => {
    const changeShop = (ev) => {
      const { shop } = ev.detail;
      setShop(shop);
    };
    window.addEventListener('selected-shop', changeShop);

    return () => {
      window.removeEventListener('selected-shop', changeShop);
    };
  }, []);

  return shop;
}

const defaultForm = {
  firstName: '',
  lastName: '',
};

const Checkout = () => {
  const shop = useShop();
  const [data, setData] = useState(defaultForm)
  const isInvalid = !shop || !data.firstName || !data.lastName;

  function changeData(ev) {
    const { name, value } = ev.currentTarget;
    setData({
      ...data,
      [name]: value,
    });
  }

  function submit(ev) {
    window.dispatchEvent(new CustomEvent('clear-cart'));
    history.pushState({}, undefined, '/checkout/thanks');
    ev.preventDefault();
  }

  return (
    <div data-boundary-page="checkout">
      <CompactHeader />
      <main class="c_Checkout">
        <h2>Checkout</h2>
        <form action="/checkout/place-order" method="post" class="c_Checkout__form" onSubmit={submit}>
          <h3>Personal Data</h3>
          <fieldset class="c_Checkout__name">
            <div>
              <label class="c_Checkout__label" for="c_firstname">
                First name
              </label>
              <input class="c_Checkout__input" type="text" id="c_firstname" name="firstName" required value={data.firstName} onChange={changeData} />
            </div>
            <div>
              <label class="c_Checkout__label" for="c_lastname">
                Last name
              </label>
              <input class="c_Checkout__input" type="text" id="c_lastname" name="lastName" required value={data.lastName} onChange={changeData} />
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
            <input class="c_Checkout__input" type="text" id="c_storeId" name="storeId" value={shop} readonly required />
          </fieldset>

          <div class="c_Checkout__buttons">
            <Button type="submit" variant="primary" disabled={isInvalid}>
              place order
            </Button>
            <Button href="/checkout/cart" variant="secondary">
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
