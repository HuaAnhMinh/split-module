const extractionStructure = {
  type: 'VariableDeclaration',
  kind: 'const',
  declarations: [{
    type: 'VariableDeclarator',
    id: {
      type: 'ObjectPattern'
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

module.exports = extractionStructure;