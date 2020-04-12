<template>
  <div id="app">
    <!--路由占位符-->
    <router-view></router-view>
  </div>
</template>

<script>

  export default {
    name: 'app'
  }
</script>

<style lang="less">

  .el-tabs {
    height: 100%;
    border: 0 !important;

    .el-tabs__content {
      height: calc(100% - 40px) !important;
      padding: 0 !important;
    }
  }

</style>
