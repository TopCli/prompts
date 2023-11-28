// CONSTANTS
const kAnsiRegex = ansiRegex();

/**
 * @see https://github.com/chalk/ansi-regex#readme
 */
export function ansiRegex({onlyFirst = false} = {}) {
	const pattern = [
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'
	].join('|');

	return new RegExp(pattern, onlyFirst ? undefined : 'g');
}

export function stripAnsi(string) {
  return string.replace(kAnsiRegex, '');
}
