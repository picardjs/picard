import { h } from 'preact';
import VariantOption from './components/VariantOption';
import data from './data/db.json';
import { src, srcset, getLifecycle } from './js/utils';

const ProductPage = ({ id }) => {
  const sku = new URL(location.href).searchParams.get('sku');
  const { name, variants, highlights = [] } = data.products.find((p) => p.id === id);
  const variant = variants.find((v) => v.sku === sku) || variants[0];

  return (
    <div data-boundary-page="decide">
      <pi-slot name="Header" />
      <main class="d_ProductPage">
        <div class="d_ProductPage__details">
          <img
            class="d_ProductPage__productImage"
            src={src(variant.image, 400)}
            srcset={srcset(variant.image, [400, 800])}
            sizes="400px"
            width="400"
            height="400"
            alt={`${name} - ${variant.name}`}
          />
          <div class="d_ProductPage__productInformation">
            <h2 class="d_ProductPage__title">{name}</h2>
            <ul class="d_ProductPage__highlights">
              {highlights.map((highlight) => (
                <li>{highlight}</li>
              ))}
            </ul>
            <ul class="d_ProductPage__variants">
              {variants.map((v) => (
                <VariantOption {...{ ...v, selected: v.sku === variant.sku }} />
              ))}
            </ul>
            <pi-component name="AddToCart" source="checkout" data={{ sku: variant.sku }} />
          </div>
        </div>
        <pi-component name="Recommendations" source="explore" data={{ skus: [variant.sku] }} />
      </main>
      <pi-slot name="Footer" />
    </div>
  );
};

export default getLifecycle(ProductPage);
