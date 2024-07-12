import { h } from 'preact';
import data from './data/db.json';
import Recommendation from './components/Recommendation';
import { getLifecycle } from './js/utils';

const r = data.recommendations;

function averageColor(colors) {
  const total = colors.reduce((acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b], [0, 0, 0]);
  return total.map((c) => Math.round(c / colors.length));
}

function skusToColors(skus) {
  return skus.filter((sku) => r[sku]).map((sku) => r[sku].rgb);
}

function colorDistance(rgb1, rgb2) {
  const [r1, g1, b1] = rgb1;
  const [r2, g2, b2] = rgb2;
  return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
}

function recosForSkus(skus, length = 4) {
  const targetRgb = averageColor(skusToColors(skus));
  let distances = [];

  for (let sku in r) {
    if (!skus.includes(sku)) {
      const distance = colorDistance(targetRgb, r[sku].rgb);
      distances.push({ sku, distance });
    }
  }

  distances.sort((a, b) => a.distance - b.distance);
  return distances.slice(0, length).map((d) => r[d.sku]);
}

const Recommendations = ({ skus }) => {
  const recos = recosForSkus(skus);
  return recos.length ? (
    <div class="e_Recommendations" data-boundary="explore">
      <h2>Recommendations</h2>
      <ul class="e_Recommendations_list">
        {recos.map((reco) => (
          <Recommendation {...reco} />
        ))}
      </ul>
    </div>
  ) : null;
};

export default getLifecycle(Recommendations);
