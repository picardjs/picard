import { h } from 'preact';
import data from './data/db.json';
import Product from './components/Product';
import Filter from './components/Filter';
import { getLifecycle } from './js/utils';

const CategoryPage = ({ category }) => {
  const cat = category && data.categories.find((c) => c.key === category);

  const title = cat ? cat.name : 'All Machines';
  const products = cat ? cat.products : data.categories.flatMap((c) => c.products);

  // sort products by price descending
  products.sort((a, b) => b.startPrice - a.startPrice);

  const filters = [
    { url: '/products', name: 'All', active: !cat },
    ...data.categories.map((c) => ({
      url: `/products/${c.key}`,
      name: c.name,
      active: c.key === category,
    })),
  ];

  return (
    <div data-boundary-page="explore">
      <pi-slot name="Header" />
      <main class="e_CategoryPage">
        <h2>{title}</h2>
        <div class="e_CategoryPage__subline">
          <p>{products.length} products</p>
          <Filter filters={filters} />
        </div>
        <ul class="e_CategoryPage_list">
          {products.map((product) => (
            <Product {...product} />
          ))}
        </ul>
      </main>
      <pi-slot name="Footer" />
    </div>
  );
};

export default getLifecycle(CategoryPage);
