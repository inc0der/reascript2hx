export function formatAsMultilineComment (text, maxLineLength = 80) {
  function wrapText (text, maxLength) {
    const words = text.trim().split(/\s+/);
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine && currentLine.length + word.length + 1 > maxLength) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  if (!text) {
    return '/** No description available */';
  }

  const wrappedLines = String(text)
    .split(/\r?\n/)
    .flatMap(line => line.trim() ? wrapText(line, maxLineLength - 3) : [""]); // -3 for " * "

  const commentLines = wrappedLines.map(line => ` * ${line}`);
  const formattedComment = [
    '/**',
    ...commentLines,
    ' */'
  ].join('\n');

  return formattedComment;
}
