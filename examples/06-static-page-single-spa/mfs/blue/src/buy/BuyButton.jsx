import React from 'react';
import './buy-button.css';

const defaultPrice = '0,00 €';
const prices = {
  porsche: '66,00 €',
  fendt: '54,00 €',
  eicher: '58,00 €',
};

if (typeof window.cart === 'undefined') {
  window.cart = {
    count: 0,
  };
}

const BuyButton = ({ sku = 'porsche' }) => {
  const price = prices[sku] || defaultPrice;
  const submit = (e) => {
    e.preventDefault();
    window.cart.count++;
    window.dispatchEvent(new CustomEvent('update-cart', {}));
    return false;
  };

  return (
    <div id="buy" className="blue-basket">
      <form method="POST" onSubmit={submit}>
        <button>
          <span className="buy-icon"></span>
          <span>buy for {price}</span>
        </button>
        <input type="hidden" name="store" value="cart" />
        <input type="hidden" name="item" value={price} />
      </form>
    </div>
  );
};

export default BuyButton;
