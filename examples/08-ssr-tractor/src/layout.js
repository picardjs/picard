const layout = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="A tractor shop composed of server-rendered micro frontends.">
<title>Picard.js SSR Tractor Example</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<main id="app">{{content}}</main>
</body>
</html>`;

export function render(variables) {
  let html = layout;
  Object.entries(variables).forEach(([name, value]) => {
    html = html.replace(`{{${name}}}`, value);
  });
  return html;
}
