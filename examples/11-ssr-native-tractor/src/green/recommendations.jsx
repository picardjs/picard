import * as React from 'react';
import reco_1 from './images/reco_1.jpg';
import reco_2 from './images/reco_2.jpg';
import reco_3 from './images/reco_3.jpg';
import reco_4 from './images/reco_4.jpg';
import reco_5 from './images/reco_5.jpg';
import reco_6 from './images/reco_6.jpg';
import reco_7 from './images/reco_7.jpg';
import reco_8 from './images/reco_8.jpg';
import reco_9 from './images/reco_9.jpg';
import css from './recommendations.css';

function getUrl(path) {
  return new URL(path, import.meta.url).href;
}

const recommendationImages = {
  '1': getUrl(reco_1),
  '2': getUrl(reco_2),
  '3': getUrl(reco_3),
  '4': getUrl(reco_4),
  '5': getUrl(reco_5),
  '6': getUrl(reco_6),
  '7': getUrl(reco_7),
  '8': getUrl(reco_8),
  '9': getUrl(reco_9),
};

const allRecommendations = {
  porsche: ['3', '5', '6'],
  fendt: ['3', '6', '4'],
  eicher: ['1', '8', '7'],
};

const Recommendations = ({ sku = 'porsche' }) => {
  const recommendations = allRecommendations[sku] || allRecommendations.porsche;

  return (
    <>
      <link rel="stylesheet" href={getUrl(css)} />
      <div id="reco" className="green-recos">
        <h3>Related Products</h3>
        {recommendations.map((id) => (
          <img src={recommendationImages[id]} key={id} alt={`Recommendation ${id}`} />
        ))}
      </div>
    </>
  );
};

export default Recommendations;
