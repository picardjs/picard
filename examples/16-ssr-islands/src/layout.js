export const layout = () => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Picard.js SSR with Islands Example</title>
<pi-part name="style"></pi-part>
</head>
<body>
  <h1>Islands</h1>
  <section id="counter">
    <h2>Hydrated on load</h2>
    <pi-slot name="counter" data='{"start":5}'></pi-slot>
  </section>
  <section id="client-only">
    <h2>Rendered on the client</h2>
    <pi-slot name="client-only"></pi-slot>
  </section>
  <section id="server-only">
    <h2>Rendered on the server</h2>
    <pi-slot name="server-only"></pi-slot>
  </section>
  <div style="height: 200vh"></div>
  <section id="visible">
    <h2>Hydrated when visible</h2>
    <pi-slot name="visible"></pi-slot>
  </section>
  <pi-part name="script"></pi-part>
</body>
</html>`;
