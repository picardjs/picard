import { h } from 'preact';

export default () => {
  return (
    <nav class="e_Navigation">
      <ul class="e_Navigation__list">
        <li class="e_Navigation__item">
          <a href="/products">Machines</a>
        </li>
        <li class="e_Navigation__item">
          <a href="/stores">Stores</a>
        </li>
      </ul>
    </nav>
  );
};
