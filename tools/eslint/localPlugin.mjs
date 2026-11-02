import { maxLineLengthRule } from './maxLineLengthRule.mjs';
import { noCommentsRule } from './noCommentsRule.mjs';

export const localPlugin = {
  meta: { name: 'graveshift-local' },
  rules: {
    'no-comments': noCommentsRule,
    'max-line-length': maxLineLengthRule,
  },
};
