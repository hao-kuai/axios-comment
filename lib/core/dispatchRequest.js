'use strict';

var utils = require('./../utils');
var transformData = require('./transformData');
var isCancel = require('../cancel/isCancel');
var defaults = require('../defaults');

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
}

/**
 * 使用配置的适配器向服务器发送请求。
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  // 1.取保 headers 对象存在
  config.headers = config.headers || {};

  // 2.转换请求数据
  config.data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  );

  // 3.展开 headers
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers
  );

  // 4.删除 headers 配置
  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  // 5.获取适配器
  var adapter = config.adapter || defaults.adapter;

  // 6.使用适配器请求数据
  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // 转换响应数据
    response.data = transformData(
      response.data,
      response.headers,
      config.transformResponse
    );

    // 返回响应数据
    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // 转换响应数据
      if (reason && reason.response) {
        reason.response.data = transformData(
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        );
      }
    }
    // 返回一个状态为失败的Promise对象，并将给定的失败信息传递给对应的处理方法
    return Promise.reject(reason);
  });
};
