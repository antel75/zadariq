import { Helmet } from 'react-helmet-async';

interface PageSEOProps {
  title: string;
  description: string;
  path: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const BASE = 'https://zadariq.lovable.app';

export const PageSEO = ({ title, description, path, jsonLd }: PageSEOProps) => {
  const url = `${BASE}${path}`;
  const t = title.length > 60 ? title.slice(0, 57) + '…' : title;
  const d = description.length > 160 ? description.slice(0, 157) + '…' : description;
  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={d} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={d} />
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};
