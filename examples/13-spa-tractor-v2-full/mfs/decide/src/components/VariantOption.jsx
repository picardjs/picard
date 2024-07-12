import { h } from 'preact';

export default ({ sku, name, selected, color }) => {
  return (
    <li class="d_VariantOption" style={`--variant-color: ${color}`}>
      <i class="d_VariantOption__color"></i>
      {selected ? <strong>{name}</strong> : <a href={`?sku=${sku}`}>{name}</a>}
    </li>
  );
};
