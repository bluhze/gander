export function renderParagraph(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold text-zinc-900">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}
