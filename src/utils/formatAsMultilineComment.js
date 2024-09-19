export function formatAsMultilineComment (text, maxLineLength = 80) {
  function wrapText (text, maxLength) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  if (!text) {
    return text
  }

  const wrappedLines = wrapText(text, maxLineLength - 3); // -3 for " * "

  const commentLines = wrappedLines.map(line => ` * ${line}`);
  const formattedComment = [
    '/**',
    ...commentLines,
    ' */'
  ].join('\n');

  return formattedComment;
}