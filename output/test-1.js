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