export function required() {
  return {
    validate: (input) => input !== "",
    error: () => "required"
  };
}
