'use strict';
/**
  * bind 函数的实现
  *
  * @param {Function} fn 函数
  * @param {any} thisArg 指定this参数
  * @return {Function}
 * */
module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};
