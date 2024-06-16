const layout = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Picard.js SSR Tractor Example</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<div id="app">{{content}}</div>
</body>
</html>`;

export function render(variables) {
  let html = layout;
  Object.entries(variables).forEach(([name, value]) => {
    html = html.replace(`{{${name}}}`, value);
  });
  return html;
}
