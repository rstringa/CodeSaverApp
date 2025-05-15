export function useFormattedCode(snippet: { contenido: string }) {
	if (!snippet || !snippet.contenido) return '';
	const lines = snippet.contenido.split('\n');
	const adjustedLines: string[] = [];
	let indentLevel = 0;

	for (let i = 0; i < lines.length; i++) {
		const currentLine = lines[i].trim();

		// Reduce indent if line starts with '}'
		if (currentLine.startsWith('}')) {
			indentLevel = Math.max(indentLevel - 1, 0);
		}

		adjustedLines.push('  '.repeat(indentLevel) + currentLine);

		// Increase indent if current line ends with '{'
		if (currentLine.endsWith('{')) {
			indentLevel++;
		}
	}

	return adjustedLines.join('\n');
}
