import { h } from 'preact';
import data from './data/db.json';
import Button from './components/Button';
import { src, srcset, getLifecycle } from './js/utils';

const StorePicker = () => {
  return (
    <div class="e_StorePicker">
      <div class="e_StorePicker_control" data-boundary="explore">
        <div class="e_StorePicker_selected"></div>
        <Button className="e_StorePicker_choose" type="button">
          choose a store
        </Button>
      </div>
      <dialog class="e_StorePicker_dialog" data-boundary="explore">
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
                <Button className="e_StorePicker_select" type="button" dataId={s.id}>
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
