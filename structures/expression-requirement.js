const expressionStructure = {
  type: 'VariableDeclaration',
  kind: 'const',
  declarations: [{
    type: 'VariableDeclarator',
    id: {
      type: 'Identifier'
    },
    init: {
      type: 'MemberExpression',
      object: {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'require'
        }
      }
    }
  }]
};

module.exports = expressionStructure;