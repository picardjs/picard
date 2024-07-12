import { h } from 'preact';
import data from './data/db.json';
import { src, srcset, getLifecycle } from './js/utils';

const HomePage = () => {
  return (
    <div data-boundary-page="explore">
      <pi-slot name="Header" />
      <main class="e_HomePage">
        {data.teaser.map(({ title, image, url }) => (
          <a class="e_HomePage__categoryLink" href={url}>
            <img
              src={src(image, 500)}
              srcset={srcset(image, [500, 1000])}
              sizes="100vw, (min-width: 500px) 50vw"
              alt=""
            />
            {title}
          </a>
        ))}
        <div class="e_HomePage__recommendations">
          <pi-component
            name="Recommendations"
            source="explore"
            data={{
              skus: ['CL-01-GY', 'AU-07-MT'],
            }}
          />
        </div>
      </main>
      <pi-slot name="Footer" />
    </div>
  );
};

export default getLifecycle(HomePage);
