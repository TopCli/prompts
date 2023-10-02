export function required() {
  return {
    validate: (input) => (Array.isArray(input) ? input.length > 0 : Boolean(input)),
    error: () => "required"
  };
}
