import { h } from 'preact';

export default ({ href, type, value, disabled, rounded, className, children, dataId, variant = 'secondary' }) => {
  const tag = href ? 'a' : 'button';
  return h(
    tag,
    {
      disabled,
      href,
      type,
      value,
      'data-id': dataId ? dataId : undefined,
      class: `e_Button e_Button--${variant} ${className} ${rounded ? 'e_Button--rounded' : ''}`,
    },
    <div class="e_Button__inner">{children}</div>,
  );
};
