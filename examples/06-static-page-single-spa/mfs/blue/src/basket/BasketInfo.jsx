import React from 'react';
import './basket-info.css';

if (typeof window.cart === 'undefined') {
  window.cart = {
    count: 0,
  };
}

const BasketInfo = () => {
  const [count, setCount] = React.useState(window.cart.count);

  React.useEffect(() => {
    const handler = () => setCount(window.cart.count);

    window.addEventListener('update-cart', handler);

    return () => {
      window.removeEventListener('update-cart', handler);
    };
  }, []);

  return (
    <div id="basket" className="blue-basket">
      <div className={count === 0 ? 'empty' : 'filled'}>Basket: {count} item(s)</div>
    </div>
  );
};

export default BasketInfo;
