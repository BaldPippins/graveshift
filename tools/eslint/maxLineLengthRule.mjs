const IMPORT_LINE = /^import\s/;
const URL = /\w+:\/\/\S+/;

export const maxLineLengthRule = {
  meta: {
    type: 'layout',
    docs: { description: 'Limit line length; wrap long code and split long strings' },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'integer', minimum: 1 } },
        required: ['max'],
        additionalProperties: false,
      },
    ],
    messages: {
      tooLong: 'Line is {{length}} characters long. Maximum allowed is {{max}}.',
    },
  },
  create(context) {
    const { max } = context.options[0];
    return {
      Program() {
        context.sourceCode.lines.forEach((line, index) => {
          if (line.length <= max || IMPORT_LINE.test(line) || URL.test(line)) {
            return;
          }
          context.report({
            loc: {
              start: { line: index + 1, column: max },
              end: { line: index + 1, column: line.length },
            },
            messageId: 'tooLong',
            data: { length: line.length, max },
          });
        });
      },
    };
  },
};
