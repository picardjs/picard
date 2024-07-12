import { h } from 'preact';
import data from './data/db.json';
import Store from './components/Store';
import { getLifecycle } from './js/utils';

const StoresPage = () => {
  return (
    <div data-boundary-page="explore">
      <pi-slot name="Header" />
      <main class="e_StoresPage">
        <h2>Our Stores</h2>
        <p>
          Want to see our products in person? Visit one of our stores to see our products up close and talk to our
          experts. We have stores in the following locations:
        </p>
        <ul class="e_StoresPage_list">
          {data.stores.map((store) => (
            <Store {...store} />
          ))}
        </ul>
      </main>
      <pi-slot name="Footer" />
    </div>
  );
};

export default getLifecycle(StoresPage);
