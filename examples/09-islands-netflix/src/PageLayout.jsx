import * as React from 'react';
import cssText from './style.scss';
import Logo from './Logo';
import Footer from './Footer';

export default function ({ route }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
        <meta name="msapplication-TileColor" content="#212121" />
        <meta name="theme-color" content="#e6020c" />
        <title>Picard - Notflix Islands Demo</title>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <style dangerouslySetInnerHTML={{ __html: cssText }} />
        <piral-part name="style" />
      </head>
      <body>
        <div id="app">
          <div className="main-wrapper">
            <header className="Header">
              <Logo />
              <div id="navigation" className="Navigation">
                <nav>
                  <ul>
                    <piral-slot name="menu" item-template-id="menu-template" />
                  </ul>
                </nav>
              </div>
              <piral-slot name="header-items" />
            </header>
            <piral-slot rel="router" name={`page:${route}`} />
          </div>
          <Footer />
        </div>
        <template id="menu-template">
          <li>
            <slot />
          </li>
        </template>
        <piral-part name="script" />
      </body>
    </html>
  );
}
