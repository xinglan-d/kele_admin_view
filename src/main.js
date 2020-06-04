import Vue from 'vue'
import App from './App.vue'
import router from './router'
import './plugins/element.js'
// 导入字体图标
import './assets/fonts/iconfont.css'
// 导入全局样式表
import './assets/css/global.css'

import axios from 'axios'

// 配置请求的根路径
axios.defaults.baseURL = '/api'
axios.interceptors.request.use(config => {
  const token = window.sessionStorage.getItem('token')
  if (token != null) {
    config.headers.Authorization = 'Bearer' + token
  }
  return config
})
axios.interceptors.response.use(
  response => {
    // 如果返回的状态码为200，说明接口请求成功，可以正常拿到数据
    // 否则的话抛出错误
    if (response.status === 200) {
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  },
  error => {
    if (error.response.status) {
      if (error.response.status === 401) {
        window.sessionStorage.removeItem('token')
        window.top.location.href = '/login'
      }
      return Promise.reject(error.response)
    }
  }
)

Vue.prototype.$http = axios

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
