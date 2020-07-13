const path = require('path');
const fs = require('fs');

// switch to lazy call

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

// Modules called detection

const getStructureOfModuleRequired = (type='') => {
  switch (type) {
    case 'GENERAL_REQUIRE':
      break;
    default:
      return {}
  }
};

// const x = require('y');
const detectModuleCalledGeneral = (source='', j, listPropsCalled=[], structure={}) => {
  return j(source)
  .find(j.VariableDeclaration, structure)
  .replaceWith(nodePath => {
    const { node } = nodePath;

    node.kind = 'let';
    const module = node.declarations[0].init.arguments[0].value || '';
    const name = node.declarations[0].id.name;

    if (!module.includes('let')) {
      listPropsCalled.push(name);
      nodePath.insertAfter(functionLazyReplacementGeneral(name, module));
    }
    node.declarations[0].init = null;

    return node;
  })
  .toSource();
};

// const { x, y } = require('z');
const detectModuleCalledExtraction = (source='', j, listPropsCalled=[], structure={}) => {
  return j(source)
  .find(j.VariableDeclaration, structure)
  .replaceWith(nodePath => {
    const { node } = nodePath;

    const module = node.declarations[0].init.arguments[0].value || '';
    const props = [];
    node.declarations[0].id.properties.forEach(prop => {
      props.push(prop.value.name);
      listPropsCalled.push(prop.value.name);
    });

    if (!module.includes('let')) {
      nodePath.insertAfter(functionLazyReplacementExtraction(props, module));
    }

    return node;
  })
  .remove()
  .toSource();
}

// const x = require('y').z;
const detectModuleCalledExpression = (source='', j, listPropsCalled=[], structure={}) => {
  return j(source)
  .find(j.VariableDeclaration, structure)
  .replaceWith(nodePath => {
    const { node } = nodePath;

    node.kind = 'let';

    const module = node.declarations[0].init.object.arguments[0].value;
    const name = node.declarations[0].id.name;
    const propCalled = node.declarations[0].init.property.name;

    if (!module.includes('let')) {
      listPropsCalled.push(name);
      nodePath.insertAfter(functionLazyReplacementCallExpression(name, module, propCalled));
    }

    node.declarations[0].init = null;

    return node;
  })
  .toSource();
}

// change to lazy function called
const changeToLazyFunctionCalled = (source='', j, listPropsCalled=[]) => {
  listPropsCalled.forEach(prop => {
    source = source.replace(`${prop}.`, `get_${prop}().`);

    source = j(source)
    .find(j.ExpressionStatement, {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: prop
        }
      }
    })
    .replaceWith(nodePath => {
      const { node } = nodePath;

      node.expression.callee.name = `get_${prop}()`;

      return node;
    })
    .toSource();

    source = j(source)
    .find(j.ExpressionStatement, {
      type: 'ExpressionStatement',
      expression: {
        type: 'MemberExpression',
        object: {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: prop
          }
        }
      }
    })
    .replaceWith(nodePath => {
      const { node } = nodePath;

      node.expression.object.callee.name = `get_${prop}()`;

      return node;
    })
    .toSource();

    source = j(source)
    .find(j.ClassDeclaration, {
      type: 'ClassDeclaration',
      superClass: {
        type: 'Identifier',
        name: prop
      }
    })
    .replaceWith(nodePath => {
      const { node } = nodePath;

      node.superClass.name = `get_${prop}()`;

      return node;
    })
    .toSource();
  });

  return source;
};

module.exports = (fileInfo, { jscodeshift: j }, options) => {
  const listPropsCalled = [];

  let source = detectModuleCalledGeneral(fileInfo.source, j, listPropsCalled, {
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
  });

  source = detectModuleCalledExtraction(source, j, listPropsCalled, {
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
  });

  source = detectModuleCalledExpression(source, j, listPropsCalled, {
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
  });

  source = changeToLazyFunctionCalled(source, j, listPropsCalled);

  let exportedFolder = 'output';
  if (typeof options.save === 'string') {
    exportedFolder = options.save;
  }

  const pathInfo = path.parse(fileInfo.path);
  if (!fs.existsSync(exportedFolder)) {
    fs.mkdirSync(exportedFolder);
  }

  if (!pathInfo.dir) {
    const saveLocation = path.join(__dirname, exportedFolder, pathInfo.base);
    fs.writeFileSync(saveLocation, source);
  }
  else {
    let subFolders = pathInfo.dir.split('\\');
    if (process.platform !== 'win32') {
      subFolders = pathInfo.dir.split('/');
    }
    let subPath = path.join(__dirname, exportedFolder);
    subFolders.forEach(subFolder => {
      try {
        subPath = path.join(subPath, subFolder);
        if (!fs.existsSync(subPath)) {
          fs.mkdirSync(subPath);
        }
      }
      catch (error) { /** ignored */ }
    });

    const saveFile = path.join(subPath, pathInfo.base);
    fs.writeFileSync(saveFile, source);
  }

  return source;
};