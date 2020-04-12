<template>
  <div class="main">
    <div class="search-from">
    </div>
    <div class="table-list">
      <template>
        <el-table
          :data="tableData"
          border
          style="width: 100%">
          <el-table-column
            prop="date"
            label="日期"
            width="180">
          </el-table-column>
          <el-table-column
            prop="name"
            label="姓名"
            width="180">
          </el-table-column>
          <el-table-column
            prop="address"
            label="地址">
          </el-table-column>
        </el-table>
      </template>
    </div>
  </div>

</template>

<script>
  export default {
    data () {
      return {
        tableData: []
      }
    }
  }
</script>

<style lang="less" scoped>

  .search-from, .table-list {
    width: 90%;
    margin-left: 5%;
    margin-top: 50px;
    background-color: #666666;
  }

  .main {
    height: 100%;
    width: 100%;
  }

</style>
