import * as React from 'react';
import css from './buy-button.css';

function getUrl(path) {
  return new URL(path, import.meta.url).href;
}

const defaultPrice = '0,00 €';
const prices = {
  porsche: '66,00 €',
  fendt: '54,00 €',
  eicher: '58,00 €',
};

const BuyButton = ({ sku = 'porsche' }) => {
  const price = prices[sku] || defaultPrice;

  return (
    <>
      <link rel="stylesheet" href={getUrl(css)} />
      <div id="buy" className="blue-basket">
        <form method="POST">
          <button>
            <span className="buy-icon"></span>
            <span>buy for {price}</span>
          </button>
          <input type="hidden" name="store" value="cart" />
          <input type="hidden" name="item" value={price} />
        </form>
      </div>
    </>
  );
};

export default BuyButton;
