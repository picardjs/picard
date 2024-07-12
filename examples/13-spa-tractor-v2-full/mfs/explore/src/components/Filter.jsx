import { h } from 'preact';

export default ({ filters }) => {
  return (
    <div class="e_Filter">
      Filter:
      <ul>
        {filters.map((f) =>
          f.active ? (
            <li class="e_Filter__filter--active">{f.name}</li>
          ) : (
            <li>
              <a href={f.url}>{f.name}</a>
            </li>
          ),
        )}
      </ul>
    </div>
  );
};
