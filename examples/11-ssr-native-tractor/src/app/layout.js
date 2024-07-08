function escapeHtml(str) {
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[tag],
  );
}

export const layout = (data) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Picard.js SSR with Native Federation Example: Tractor Shop</title>
<pi-part name="style"></pi-part>
<link rel="stylesheet" href="/style.css">
</head>
<body>
  <pi-component name="Products" source="red" framework="react" data="${escapeHtml(JSON.stringify(data))}"></pi-component>
</body>
</html>`;
