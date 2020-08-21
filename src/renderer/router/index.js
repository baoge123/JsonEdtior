import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'json-builder',
      component: require('@/pages/index').default
    },
    {
      path: '/xls',
      name: 'xlstojson',
      component: require('@/pages/xlstojson').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
