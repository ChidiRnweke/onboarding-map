export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Squash merges use the PR body as the commit body, and release-please
    // writes its own; both carry long URLs. Only the header drives versions
    // and the changelog, so body and footer line length are not checked.
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
};
