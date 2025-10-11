interface JsonLdProps {
  data: object | object[];
  id?: string;
}

export default function JsonLd({ data, id }: JsonLdProps) {
  const jsonString = Array.isArray(data) ? JSON.stringify(data) : JSON.stringify(data);

  return (
    <script type="application/ld+json" id={id} dangerouslySetInnerHTML={{ __html: jsonString }} />
  );
}
