import { h, createRef } from 'preact';
import { useState } from 'preact/hooks';
import data from './data/db.json';
import Button from './components/Button';
import { src, srcset, getLifecycle } from './js/utils';

const StorePicker = () => {
  const [currentStore, setCurrentStore] = useState('');

  const ref = createRef();

  const openDialog = () => {
    ref.current.showModal();
  };

  const selectShop = (e) => {
    const shop = e.currentTarget.getAttribute('data-id');
    setCurrentStore(e.currentTarget.previousElementSibling.innerHTML);
    window.dispatchEvent(
      new CustomEvent('selected-shop', {
        detail: { shop },
      }),
    );
    ref.current.close();
  };

  return (
    <div class="e_StorePicker">
      <div class="e_StorePicker_control" data-boundary="explore">
        <div class="e_StorePicker_selected" dangerouslySetInnerHTML={{ __html: currentStore }} />
        <Button className="e_StorePicker_choose" type="button" onClick={openDialog}>
          choose a store
        </Button>
      </div>
      <dialog class="e_StorePicker_dialog" data-boundary="explore" ref={ref}>
        <div class="e_StorePicker_wrapper">
          <h2>Stores</h2>
          <ul class="e_StorePicker_list">
            {data.stores.map((s) => (
              <li class="e_StorePicker_entry">
                <div class="e_StorePicker_content">
                  <img
                    class="e_StorePicker_image"
                    src={src(s.image, 200)}
                    srcset={srcset(s.image, [200, 400])}
                    width="200"
                    height="200"
                  />
                  <p class="e_StorePicker_address">
                    {s.name}
                    <br />
                    {s.street}
                    <br />
                    {s.city}
                  </p>
                </div>
                <Button className="e_StorePicker_select" type="button" dataId={s.id} onClick={selectShop}>
                  select
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </div>
  );
};

export default getLifecycle(StorePicker);
