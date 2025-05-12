interface FormatCodeOptions {
	code: string;
}

export function customFormatCode({ code }: FormatCodeOptions) {
	// Ensure `code` is a string and handle undefined/null cases
	if (typeof code !== 'string') {
		console.warn('Invalid code provided to customFormatCode:', code);
		return ''; // Return an empty string if `code` is invalid
	}

	// Format the code
	code = code.replace(/\s+/g, ' ').trim(); // Remove leading spaces from each line
	//code = code.replace(/\s+/g, '');
	return code;
}