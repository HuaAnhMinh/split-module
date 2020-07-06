let fs;

function get_fs() {
  return fs || (fs = require('fs'));
}

let path;

function get_path() {
  return path || (path = require('path'));
}

const number = 1;