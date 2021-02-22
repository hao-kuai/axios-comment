'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');

/**
 * Axios 构造函数
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  //默认配置对象属性
  this.defaults = instanceConfig;
  //拦截器对象属性
  this.interceptors = {
    //请求拦截器
    request: new InterceptorManager(),
    //响应拦截器
    response: new InterceptorManager()
  };
}

/**
 * 发送请求
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  // 1.检查参数类型，生成传入配置对象
  if (typeof config === 'string') {
    config = arguments[1] || {};
    config.url = arguments[0];
  } else {
    config = config || {};
  }

  // 2.合并传入配置和默认配置对象
  config = mergeConfig(this.defaults, config);

  // 3.设置配置对象的请求方式：传入配置 > 实例配置 > get
  if (config.method) {
    //使用传入配置中的请求方式并转小写
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    //使用初始化对象配置中的请求方式并转小写
    config.method = this.defaults.method.toLowerCase();
  } else {
    //默认 get 请求
    config.method = 'get';
  }

  // 4.链接拦截器中间件
  var chain = [dispatchRequest, undefined];
  var promise = Promise.resolve(config);

  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};

/**
  * 获取指定配置的 Uri
  * @param{Object}config 配置对象
  * */
Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// Provide aliases for supported request methods
// 提供支持的请求方法的别名
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: (config || {}).data
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});

module.exports = Axios;
