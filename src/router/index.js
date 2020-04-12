import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../views/Login'
import Home from '../views/Home'
import List from '../views/List'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: Login
  },
  {
    path: '/home',
    component: Home
  },
  {
    path: '/getAll',
    component: List
  }
]

const router = new VueRouter({
  mode: 'history',
  routes: routes
})
// 挂载路由导航守卫
router.beforeEach((to, from, next) => {
  if (to.path === '/login') return next()
  // 判断是否存在token
  const token = window.sessionStorage.getItem('token')
  if (!token) {
    return next('/login')
  }
  return next()
})

export default router
