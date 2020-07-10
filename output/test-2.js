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