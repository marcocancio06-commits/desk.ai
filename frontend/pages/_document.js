import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%232563eb'/><text x='50' y='70' font-size='60' text-anchor='middle' fill='white' font-family='system-ui, -apple-system, sans-serif' font-weight='700'>D</text></svg>" />
        
        {/* Meta tags */}
        <meta name="description" content="Desk.ai - AI-powered customer engagement platform for service businesses" />
        <meta name="theme-color" content="#2563eb" />
        
        {/* Fonts - Using system fonts for better performance */}
        <style>{`
          @font-face {
            font-family: 'Inter var';
            font-style: normal;
            font-weight: 100 900;
            font-display: swap;
            src: local('Inter');
          }
        `}</style>
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
