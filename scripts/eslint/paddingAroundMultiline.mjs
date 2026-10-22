const LISTS = {
    Program: 'body',
    BlockStatement: 'body',
    StaticBlock: 'body',
    ClassBody: 'body',
    SwitchCase: 'consequent',
    TSInterfaceBody: 'body',
    TSTypeLiteral: 'members',
    ObjectExpression: 'properties',
    ObjectPattern: 'properties',
    ArrayExpression: 'elements',
    ArrayPattern: 'elements',
    JSXElement: 'children',
    JSXFragment: 'children',
};

const paddingAroundMultiline = {
    meta: {
        type: 'layout',
        docs: { description: 'Separate multiline siblings with a blank line, without padding container edges.' },
        fixable: 'whitespace',
        schema: [],
        messages: { missingPadding: 'Add a blank line around this multiline element.' },
    },

    create(context) {
        return Object.fromEntries(Object.entries(LISTS).map(([ type, property ]) => [
            type, (node) => checkList(context, node[property]),
        ]));
    },
};

function checkList(context, children) {
    const nodes = children.filter((node) => node && !(node.type === 'JSXText' && node.value.trim() === ''));

    nodes.forEach((next, index) => {
        const previous = nodes[index - 1];

        if (previous && needsPadding(previous, next)) {
            checkGap(context, previous, next);
        }
    });
}

function needsPadding(previous, next) {
    if (previous.type === 'JSXText' || next.type === 'JSXText') {
        return false;
    }

    return previous.loc.end.line < next.loc.start.line
        && (previous.loc.start.line !== previous.loc.end.line || next.loc.start.line !== next.loc.end.line);
}

function checkGap(context, previous, next) {
    const source = context.sourceCode;
    const comment = source.getCommentsBefore(next).find((item) => item.loc.start.line > previous.loc.end.line);
    const boundary = comment ?? next;
    const lines = source.lines.slice(previous.loc.end.line, boundary.loc.start.line - 1);

    if (lines.some((line) => line.trim() === '')) {
        return;
    }

    const offset = source.getIndexFromLoc({ line: boundary.loc.start.line, column: 0 });

    context.report({
        node: next,
        messageId: 'missingPadding',
        fix: (fixer) => fixer.insertTextBeforeRange([ offset, offset ], '\n'),
    });
}

export default paddingAroundMultiline;
