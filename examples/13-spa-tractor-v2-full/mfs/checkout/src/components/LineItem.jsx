import { h } from 'preact';
import Button from './Button';
import { src, srcset } from '../js/utils';

export default ({ sku, id, name, quantity, total, image }) => {
  const url = `/product/${id}?sku=${sku}`;

  function submit(ev) {
    window.dispatchEvent(
      new CustomEvent('remove-from-cart', {
        detail: { sku },
      }),
    );
    ev.preventDefault();
  }

  return (
    <li class="c_LineItem">
      <a href={url} class="c_LineItem__image">
        <img
          src={src(image, 200)}
          srcset={srcset(image, [200, 400])}
          sizes="200px"
          alt={name}
          width="200"
          height="200"
        />
      </a>
      <div class="c_LineItem__details">
        <a href={url} class="c_LineItem__name">
          <strong>{name}</strong>
          <br />
          {sku}
        </a>

        <div class="c_LineItem__quantity">
          <span>{quantity}</span>

          <form action="/checkout/cart/remove" method="post" onSubmit={submit}>
            <input type="hidden" name="sku" value={sku} />
            <Button
              variant="secondary"
              rounded
              type="submit"
              value="remove"
              size="small"
              title={`Remove ${name} from cart`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" height="20" width="20" viewBox="0 0 48 48">
                <path
                  fill="#000"
                  d="m40 5.172-16 16-16-16L5.171 8l16.001 16L5.171 40 8 42.828l16-16 16 16L42.828 40l-16-16 16-16L40 5.172Z"
                />
              </svg>
            </Button>
          </form>
        </div>
        <div class="c_LineItem__price">{total} Ø</div>
      </div>
    </li>
  );
};
