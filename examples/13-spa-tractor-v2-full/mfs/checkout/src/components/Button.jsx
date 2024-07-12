import { h } from 'preact';

export default ({
  href,
  type,
  value,
  disabled,
  rounded,
  className = '',
  children,
  dataId,
  size = 'normal',
  variant = 'secondary',
  title,
}) => {
  const tag = href ? 'a' : 'button';
  return h(
    tag,
    {
      disabled,
      href,
      type,
      value,
      title,
      'data-id': dataId ? dataId : undefined,
      class: `c_Button c_Button--${variant} ${className} ${rounded ? 'c_Button--rounded' : ''} c_Button--size-${size}`,
    },
    <div class="c_Button__inner">{children}</div>,
  );
};
