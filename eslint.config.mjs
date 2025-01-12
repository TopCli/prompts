import { typescriptConfig } from "@openally/config.eslint";

export default typescriptConfig([{
  files: ["demo.js"],
  rules: {
    // Since we use TS linter, it mark `console` as undefined
    "no-undef": "off"
  }
}, {
  ignores: [".temp/**"],
}]);
