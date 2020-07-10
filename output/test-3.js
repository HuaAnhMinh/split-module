let fs;

function get_fs() {
  return fs || (fs = require('fs'));
}

let path;

function get_path() {
  return path || (path = require('path'));
}

let x;

function get_x() {
  return x || (x = require('../abc/y'));
}

let a;

function get_a() {
  return a || (a = require('c'));
}

let b;

function get_b() {
  return b || (b = require('c'));
}



let d;

function get_d() {
  return d || (d = require('y').z);
}

const number = 1;

get_d()();

get_d()().g;

get_a().f;

class Test extends get_x() {
  constructor(props) {

  }
}

get_path().join('a', 'a', 'c');