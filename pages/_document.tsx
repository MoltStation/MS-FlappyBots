import { Head, Html, Main, NextScript } from 'next/document';

const extensionErrorGuard = `
(function () {
  function isWalletExtensionNoise(event) {
    var filename = String(event && event.filename ? event.filename : '');
    var message = String(event && event.message ? event.message : '');
    return filename.indexOf('chrome-extension://') === 0 &&
      message.indexOf('Cannot redefine property: ethereum') !== -1;
  }

  window.addEventListener('error', function (event) {
    if (!isWalletExtensionNoise(event)) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
})();
`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" type="image/png" href="/assets/flappybots/logo.png" />
        <link rel="apple-touch-icon" href="/assets/flappybots/logo.png" />
        <script dangerouslySetInnerHTML={{ __html: extensionErrorGuard }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
