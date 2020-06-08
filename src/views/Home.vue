<template>
  <el-container class="home-container">
    <el-aside width="200px">
      <template>
        <div class="user-info">
          <div class="user-avatar">
            <img src="https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=1234691938,822159576&fm=26&gp=0.jpg"/>
          </div>
          <div class="user-name">用户名</div>
          <div class="user-button" @click="logout">退出</div>
        </div>
      </template>
      <!--侧边栏-->
      <el-menu
        class="left-menu"
        background-color="#333744"
        text-color="#fff"
        active-text-color="#ffd04b">
        <template v-for="oneMenu in menuList">
          <el-submenu v-if="oneMenu.type == 0" :index="oneMenu.menuId" :key="oneMenu.menuId">
            <!--一级菜单模版区-->
            <template slot="title">
              <!--图标-->
              <i class="el-icon-location"></i>
              <!--文本-->
              <span>{{oneMenu.name}}</span>
            </template>
            <!--二级菜单-->
            <el-menu-item :index="twoMenu.menuId" v-for="twoMenu in oneMenu.menus" :key="twoMenu.menuId"
                          @click="addMenuTabs(twoMenu,oneMenu.serverUrl)">
              <template slot="title">
                <!--图标-->
                <i class="el-icon-location"></i>
                <!--文本-->
                <span>{{twoMenu.name}}</span>
              </template>
            </el-menu-item>
          </el-submenu>
          <el-menu-item v-if="oneMenu.type == 1" :index="oneMenu.menuId" :key="oneMenu.id"
                        @click="addMenuTabs(oneMenu)">
            <i class="el-icon-menu"></i>
            <span slot="title">{{oneMenu.name}}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <!--服务标签区-->
        <el-menu
          mode="horizontal"
          background-color="#373d41"
          text-color="#fff"
          active-text-color="#ffd04b">
          <!--服务默认只有1级-->
          <el-menu-item :index="item.serviceId" v-for="item in sysMenuList" :key="item.serviceId"
                        @click="switchService(item.serviceId)">{{item.name}}
          </el-menu-item>
        </el-menu>
      </el-header>
      <el-main>
        <!--标签页-->
        <el-tabs v-model="tabsValue" type="border-card" @tab-remove="removeMenuTabs">
          <el-tab-pane v-for="tabs in menuTabs" :key="tabs.menuId" :label="tabs.name"
                       :name="tabs.menuId" :closable="tabs.closable">
            <!--具体内容展示区-->
            <iframe class="info-show" :src="tabs.url"></iframe>
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
  export default {
    data () {
      return {
        sysMenuList: [], // 服务列表
        menuList: [], // 菜单列表
        menuTabs: [], // 标签列表
        tabsValue: null // 当前选择的标签
      }
    },
    created () {
      this.getMenuList() // 获取所有的服务和菜单
      // 默认首页
      this.menuTabs[0] = {
        menuId: '0',
        name: '首页',
        closable: false,
        url: '/admin'
      }
    },
    methods: {
      // 退出登录
      logout () {
        window.sessionStorage.clear()
        this.$router.push('/login')
      },
      // 获取所有的菜单
      async getMenuList () {
        const { data: res } = await this.$http.get('/system/sysService/getService')
        if (res.code !== 200) {
          return this.$message.error(res.msg)
        }
        this.sysMenuList = res.data
      },
      // 切换服务调用方法
      switchService (serviceId) {
        for (let i = 0; i < this.sysMenuList.length; i++) {
          const sysMenu = this.sysMenuList[i]
          if (serviceId === sysMenu.serviceId) {
            this.menuList = sysMenu.menus
            this.menuList.forEach(menu => {
              menu.serverUrl = sysMenu.servicePath
            })
            return
          }
        }
      },
      // 添加标签
      addMenuTabs (menuInfo, serverUrl) {
        this.tabsValue = menuInfo.menuId
        for (let i = 0; i < this.menuTabs.length; i++) {
          const tabs = this.menuTabs[i]
          if (tabs.menuId === menuInfo.menuId) {
            return
          }
        }
        if (serverUrl == null) {
          serverUrl = menuInfo.serverUrl ? menuInfo.serverUrl : ''
        }
        let url
        if (menuInfo.type === '1') {
          url = '/getAll?baseUrl=' + menuInfo.url + '&menuId=' + menuInfo.menuId + '&serviceUrl=' + serverUrl
        } else {
          url = '/error'
        }
        this.menuTabs.push({
          menuId: menuInfo.menuId,
          name: menuInfo.name,
          closable: true,
          url: url
        })
      },
      // 删除标签元素
      removeMenuTabs (name) {
        let tabsValue = '0'
        for (let i = 0; i < this.menuTabs.length; i++) {
          const tabs = this.menuTabs[i]
          if (tabs.menuId === name) {
            this.menuTabs.splice(i, 1)
            break
          }
          tabsValue = tabs.menuId
        }
        this.tabsValue = tabsValue
      }
    }
  }
</script>

<style lang="less" scoped>
  .user-info {
    height: 200px;
    width: 100%;
    color: #ffffff;
    background: url("../statis/img/header-profile.png");

    .user-avatar {
      width: 100%;
      height: 150px;
      position: relative;
      border-radius: 50%;

      img {
        width: 100px;
        max-height: 100px;
        position: absolute;
        border-radius: 50%;
        left: 30%;
        transform: translate(-50%, 0);
        bottom: 0px;
      }
    }
  }

  .left-menu {
    border: 0;
  }

  .home-container {
    height: 100%;
  }

  .el-header {
    background-color: #373d41;
  }

  .el-aside {
    background-color: #333744;
  }

  .el-main {
    background-color: #eaedf1;
    padding: 0;
    height: 100%;
  }

  .el-tab-pane {
    height: 100%;
  }

  .info-show {
    height: 100%;
    width: 100%;
    border: 0;
  }

</style>
