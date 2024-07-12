import { h } from 'preact';
import { src, srcset, fmtprice } from '../js/utils';

export default ({ name, url, image, startPrice }) => {
  return (
    <li class="e_Product">
      <a class="e_Product_link" href={url}>
        <img
          class="e_Product_image"
          src={src(image, 200)}
          srcset={srcset(image, [200, 400, 800])}
          sizes="300px"
          width="200"
          height="200"
        />
        <span class="e_Product_name">{name}</span>
        <span class="e_Product_price">{fmtprice(startPrice)}</span>
      </a>
    </li>
  );
};
