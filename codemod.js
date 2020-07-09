const path = require('path');
const fs = require('fs');

// const x = require('y');
const functionLazyReplacementGeneral = (name='', module='') => {
  let func = `function get_${name}() {\n`;
  func += `  return ${name} || (${name} = require('${module}'));\n}`
  return func;
};

// const { x, y } = require('z');
const functionLazyReplacementExtraction = (listVars=[], module='') => {
  let replacement = '';
  for (let i = 0; i < listVars.length; ++i) {
    replacement += `let ${listVars[i]};\n\n`;
    replacement += `function get_${listVars[i]}() {\n`;
    replacement += `  return ${listVars[i]} || (${listVars[i]} = require('${module}'));\n}\n\n`
  }

  return replacement;
};

// const x = require('y').z;
const functionLazyReplacementCallExpression = (name='', module='', propCalled='') => {
  let replacement = `function get_${name}() {\n`;
  replacement += `  return ${name} || (${name} = require('${module}').${propCalled});\n}`;
  return replacement;
};

const detectModuleCalledGeneral = (source, j) => {
  return j(source)
  .find(j.VariableDeclaration, {
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
  })
  .replaceWith(nodePath => {
    const { node } = nodePath;

    node.kind = 'let';
    const module = node.declarations[0].init.arguments[0].value || '';
    const name = node.declarations[0].id.name;

    if (!module.includes('let')) {
      nodePath.insertAfter(functionLazyReplacementGeneral(name, module));
    }
    node.declarations[0].init = null;

    return node;
  })
  .toSource();
};

const detectModuleCalledExtraction = (source, j) => {
  return j(source)
  .find(j.VariableDeclaration, {
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
  })
  .replaceWith(nodePath => {
    const { node } = nodePath;

    const module = node.declarations[0].init.arguments[0].value || '';
    const props = [];
    node.declarations[0].id.properties.forEach(prop => {
      props.push(prop.value.name);
    });

    if (!module.includes('let')) {
      nodePath.insertAfter(functionLazyReplacementExtraction(props, module));
    }

    return node;
  })
  .remove()
  .toSource();
}

const detectModuleCalledExpression = (source, j) => {
  return j(source)
  .find(j.VariableDeclaration, {
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
  })
  .replaceWith(nodePath => {
    const { node } = nodePath;

    node.kind = 'let';

    const module = node.declarations[0].init.object.arguments[0].value;
    const name = node.declarations[0].id.name;
    const propCalled = node.declarations[0].init.property.name;

    if (!module.includes('let')) {
      nodePath.insertAfter(functionLazyReplacementCallExpression(name, module, propCalled));
    }

    node.declarations[0].init = null;

    return node;
  })
  .toSource();
}

module.exports = (fileInfo, { jscodeshift: j }, options) => {
  let source = detectModuleCalledGeneral(fileInfo.source, j);
  source = detectModuleCalledExtraction(source, j);
  source = detectModuleCalledExpression(source, j);

  if (typeof options.save === 'string') {
    const saveLocation = path.join(__dirname, options.save);
    fs.writeFileSync(saveLocation, source);
  }

  return source;
};