import { typescriptConfig } from "@openally/config.eslint";

export default typescriptConfig([{
  files: ["demo.js"],
  rules: {}
}, {
  ignores: [".temp/**"],
}]);
