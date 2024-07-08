import * as React from 'react';
import css from './basket-info.css';

function getUrl(path) {
  return new URL(path, import.meta.url).href;
}

const BasketInfo = ({ count }) => {
  return (
    <>
      <link rel="stylesheet" href={getUrl(css)} />
      <div id="basket" className="blue-basket">
        <div className={count === 0 ? 'empty' : 'filled'}>Basket: {count} item(s)</div>
      </div>
    </>
  );
};

export default BasketInfo;
