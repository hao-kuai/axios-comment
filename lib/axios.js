'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var defaults = require('./defaults');

/**
 * 创建Axios实例函数
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  // 1.根据默认配置创建 Axios 实例
  var context = new Axios(defaultConfig);

  // 2.修改 Axios.prototype.request 函数的 this 指向为 context
  var instance = bind(Axios.prototype.request, context);

  // 3. 拷贝 axios.prototype 属性到 instance 函数上，
  // 3.1 同时修改函数 this 指向
  // 3.2 主要用来暴露 request、get、post...等属性
  utils.extend(instance, Axios.prototype, context);

  // 4. 拷贝 context 属性到 instance 函数上
  // 4.1 用来暴露 defaults、interceptors属性
  utils.extend(instance, context);

  return instance;
}

/*1.创建默认实例*/
var axios = createInstance(defaults);

// 1.1 暴露 Axios 构造函数
axios.Axios = Axios;

// 1.2 添加创建 axios 实例函数
axios.create = function create(instanceConfig) {
  return createInstance(mergeConfig(axios.defaults, instanceConfig));
};

// 1.3 暴露取消请求相关属性
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');

// 1.4 暴露 all 函数
axios.all = function all(promises) {
  return Promise.all(promises);
};
// 1.5 暴露 spread 函数
axios.spread = require('./helpers/spread');

// 1.6 暴露 isAxiosError 函数
axios.isAxiosError = require('./helpers/isAxiosError');

/* 2.导出默认实例 */
module.exports = axios;
// Allow use of default import syntax in TypeScript
module.exports.default = axios;
