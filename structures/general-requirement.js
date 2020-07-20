const generalStructure = {
  type: 'VariableDeclaration',
  kind: 'const',
  declarations: [{
    type: 'VariableDeclarator',
    id: {
      type: 'Identifier'
    },
    init: {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: 'require'
      }
    }
  }]
};

module.exports = generalStructure;