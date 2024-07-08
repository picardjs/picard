import * as React from 'react';
import tractorRed from './images/tractor-red.jpg';
import tractorBlue from './images/tractor-blue.jpg';
import tractorGreen from './images/tractor-green.jpg';
import tractorRedThumb from './images/tractor-red-thumb.jpg';
import tractorBlueThumb from './images/tractor-blue-thumb.jpg';
import tractorGreenThumb from './images/tractor-green-thumb.jpg';
import css from './products.css';

function getUrl(path) {
  return new URL(path, import.meta.url).href;
}

const product = {
  name: 'Tractor',
  variants: [
    {
      sku: 'porsche',
      color: 'red',
      name: 'Porsche-Diesel Master 419',
      image: getUrl(tractorRed),
      thumb: getUrl(tractorRedThumb),
      price: '66,00 €',
    },
    {
      sku: 'fendt',
      color: 'green',
      name: 'Fendt F20 Dieselroß',
      image: getUrl(tractorGreen),
      thumb: getUrl(tractorGreenThumb),
      price: '54,00 €',
    },
    {
      sku: 'eicher',
      color: 'blue',
      name: 'Eicher Diesel 215/16',
      image: getUrl(tractorBlue),
      thumb: getUrl(tractorBlueThumb),
      price: '58,00 €',
    },
  ],
};

function getCurrent(sku) {
  return product.variants.find((v) => v.sku === sku) || product.variants[0];
}

const ProductPage = ({ sku, count }) => {
  const current = getCurrent(sku);
  const item = current.sku;
  const data = JSON.stringify({ sku: item, count });

  return (
    <>
      <link rel="stylesheet" href={getUrl(css)} />
      <div id="product-page">
        <h1 id="store">The Model Store</h1>
        <pi-component name="BasketInfo" source="blue" data={data} framework="react" />
        <div id="image">
          <div>
            <img src={current.image} alt={current.name} />
          </div>
        </div>
        <h2 id="name">
          {product.name} <small>{current.name}</small>
        </h2>
        <div id="options">
          {product.variants.map((variant) => (
            <a href={`/products/${variant.sku}`} key={variant.sku} className={item === variant.sku ? 'active' : ''}>
              <img src={variant.thumb} alt={variant.name} />
            </a>
          ))}
        </div>
        <pi-component name="BuyButton" source="blue" data={data} framework="react" />
        <pi-component name="Recommendations" source="green" data={data} framework="react" />
      </div>
    </>
  );
};

export default ProductPage;
