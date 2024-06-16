import * as React from 'react';

const product = {
  name: 'Tractor',
  variants: [
    {
      sku: 'porsche',
      color: 'red',
      name: 'Porsche-Diesel Master 419',
      image: '/images/tractor-red.jpg',
      thumb: '/images/tractor-red-thumb.jpg',
      price: '66,00 €',
    },
    {
      sku: 'fendt',
      color: 'green',
      name: 'Fendt F20 Dieselroß',
      image: '/images/tractor-green.jpg',
      thumb: '/images/tractor-green-thumb.jpg',
      price: '54,00 €',
    },
    {
      sku: 'eicher',
      color: 'blue',
      name: 'Eicher Diesel 215/16',
      image: '/images/tractor-blue.jpg',
      thumb: '/images/tractor-blue-thumb.jpg',
      price: '58,00 €',
    },
  ],
};

function getCurrent(sku) {
  return product.variants.find((v) => v.sku === sku) || product.variants[0];
}

const ProductPage = ({ sku }) => {
  const current = getCurrent(sku);
  const item = current.sku;
  const data = JSON.stringify({ item });

  return (
    <>
      <h1 id="store">The Model Store</h1>
      <pi-component name="basket-info" source="blue" data={data} />
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
          <a href={`/products/${variant.sku}`} key={variant.sku} className={sku === variant.sku ? 'active' : ''}>
            <img src={variant.thumb} alt={variant.name} />
          </a>
        ))}
      </div>
      <pi-component name="buy-button" source="blue" data={data} />
      <pi-component name="recommendations" source="green" data={data} />
    </>
  );
};

export default ProductPage;
