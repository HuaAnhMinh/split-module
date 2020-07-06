const path = require('path');
const fs = require('fs');

const functionLazyReplacement = (module, name, isTriggered) => {
  let func = `function get_${name}() {\n`;
  func += `  return ${name} || (${name} = require('${module}'));\n}`
  return func;
};

module.exports = (fileInfo, { jscodeshift: j }, options) => {
  let module, name;

  let source = j(fileInfo.source)
  .find(j.VariableDeclaration, {
    declarations: [{
      type: 'VariableDeclarator',
      init: {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'require'
        }
      }
    }]
  })
  .replaceWith(nodePath => {
    const { node } = nodePath;

    node.kind = 'let';
    module = node.declarations[0].init.arguments[0].value || '';
    name = node.declarations[0].id.name;

    if (!module.includes('let')) {
      nodePath.insertAfter(functionLazyReplacement(module, name));
    }
    node.declarations[0].init = null;

    return node;
  })
  .toSource();

  if (typeof options.save === 'string') {
    const saveLocation = path.join(__dirname, options.save);
    fs.writeFileSync(saveLocation, source);
  }

  return source;
};