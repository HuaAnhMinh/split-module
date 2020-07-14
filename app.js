const fs = require('fs');
const path = require('path');

const x = require('../abc/y');

const { a, b } = require('c');

const d = require('y').z;

const number = 1;

d();

d().g;

a.f;

b().s;

class Test extends x {
  constructor(props) {

  }
}

path.join('a', 'a', 'c');

const test = x;

const test2 = x.z;