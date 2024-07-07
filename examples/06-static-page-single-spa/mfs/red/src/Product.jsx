import React from 'react';
import tractorRed from './images/tractor-red.jpg';
import tractorRedThumb from './images/tractor-red-thumb.jpg';
import tractorGreen from './images/tractor-green.jpg';
import tractorGreenThumb from './images/tractor-green-thumb.jpg';
import tractorBlue from './images/tractor-blue.jpg';
import tractorBlueThumb from './images/tractor-blue-thumb.jpg';
import './product.css';

const tractor = {
  name: 'Tractor',
  variants: [
    {
      sku: 'porsche',
      color: 'red',
      name: 'Porsche-Diesel Master 419',
      image: tractorRed,
      thumb: tractorRedThumb,
      price: '66,00 €',
    },
    {
      sku: 'fendt',
      color: 'green',
      name: 'Fendt F20 Dieselroß',
      image: tractorGreen,
      thumb: tractorGreenThumb,
      price: '54,00 €',
    },
    {
      sku: 'eicher',
      color: 'blue',
      name: 'Eicher Diesel 215/16',
      image: tractorBlue,
      thumb: tractorBlueThumb,
      price: '58,00 €',
    },
  ],
};

function getCurrent(sku) {
  return tractor.variants.find((v) => v.sku === sku) || tractor.variants[0];
}

const Product = () => {
  const [sku, setSku] = React.useState('porsche');
  const current = getCurrent(sku);
  const data = JSON.stringify({ sku });

  return (
    <div className="product-page-grid">
      <h1 id="store">The Model Store</h1>
      <pi-component
        name="BasketInfo"
        source="/mfs/blue/dist/remoteEntry.js"
        data={data}
        kind="module"
        remote-name="blue"
        framework="single-spa"
      />
      <div id="image">
        <div>
          <img src={current.image} alt={current.name} />
        </div>
      </div>
      <h2 id="name">
        {tractor.name} <small>{current.name}</small>
      </h2>
      <div id="options">
        {tractor.variants.map((variant) => (
          <a
            key={variant.sku}
            className={sku === variant.sku ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setSku(variant.sku);
            }}
            href="#">
            <img src={variant.thumb} alt={variant.name} />
          </a>
        ))}
        <pi-component
          name="Reviews"
          source="/mfs/purple/dist/remoteEntry.js"
          data={data}
          kind="module"
          remote-name="purple"
          fallback-template-id="reviews-fallback"
          framework="single-spa"
        />
      </div>
      <pi-component
        name="BuyButton"
        source="/mfs/blue/dist/remoteEntry.js"
        data={data}
        kind="module"
        remote-name="blue"
        framework="single-spa"
      />
      <pi-component
        name="Recommendations"
        source="/mfs/green/dist/remoteEntry.js"
        data={data}
        kind="module"
        remote-name="green"
        framework="single-spa"
      />
      <template id="reviews-fallback">
        <div>The reviews module is currently not available.</div>
      </template>
    </div>
  );
};

export default Product;
