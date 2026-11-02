export const noCommentsRule = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow comments in source files: code must be self-documenting' },
    schema: [],
    messages: {
      forbidden: 'Comments are forbidden. Express intent through names, types and decomposition.',
    },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          context.report({ loc: comment.loc, messageId: 'forbidden' });
        }
      },
    };
  },
};
