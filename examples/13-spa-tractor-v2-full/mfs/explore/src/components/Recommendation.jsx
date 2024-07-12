import { h } from 'preact';
import { src, srcset } from '../js/utils';

export default ({ image, url, name }) => {
  return (
    <li class="e_Recommendation">
      <a class="e_Recommendation_link" href={url}>
        <img
          class="e_Recommendation_image"
          src={src(image, 200)}
          srcset={srcset(image, [200, 400])}
          alt=""
          sizes="200px"
          width="200"
          height="200"
        />
        <span class="e_Recommendation_name">{name}</span>
      </a>
    </li>
  );
};
