const path = require('path');
const fs = require('fs');

module.exports = (fileInfo, { jscodeshift: j }, options) => {
  const source = j(fileInfo.source)
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
    .remove()
    .toSource();

  if (typeof options.save === 'string') {
    const saveLocation = path.join(__dirname, options.save);
    fs.writeFileSync(saveLocation, source);
  }

  return source;
};