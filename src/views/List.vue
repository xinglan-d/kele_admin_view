<template>
  <div class="main">
    <!--搜索框区域-->
    <div class="search-from">
      <el-form :inline="true" v-if="search.length !== 0">
        <template v-for="header in search">
          <template>
            <el-form-item :label="header.title" :key="header.primaryKey">
              <el-input v-model="header.value" :name="header.field"></el-input>
            </el-form-item>
          </template>
        </template>
        <el-form-item>
          <el-button type="primary" @click="searchTable">查询</el-button>
        </el-form-item>
      </el-form>
    </div>
    <!--列表区域-->
    <div class="table-list">
      <div class="function-button">
        <el-button type="primary" @click="addTableData">新增</el-button>
        <el-button type="primary" @click="editTableData">编辑</el-button>
        <el-button type="primary" @click="delTableData">删除</el-button>
      </div>
      <el-table :data="tableData" border
                style="min-width: 100%"
                @selection-change="checkboxData">
        <template v-for="header in tableAttr.columns">
          <template v-if="header.checkbox">
            <el-table-column :key="header.primaryKey"
                             type="selection">
            </el-table-column>
          </template>
          <template v-else>
            <el-table-column :key="header.primaryKey"
                             :prop="header.field"
                             :label="header.title">
            </el-table-column>
          </template>
        </template>
      </el-table>
      <div class="page-number">
        <el-pagination
          @size-change="editPageSize"
          @current-change="editPageNumber"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total">
        </el-pagination>
      </div>
    </div>
    <!--弹出编辑页面-->
    <!--编辑页面展示区-->
    <el-dialog title="编辑" :visible="editVisible" @close="closeEditPage">
      <el-form label-width="80px" ref="editFormRef" :model="editForm" :rules="editFormRules">
        <el-form-item v-for="parameter in editAttr" :label="parameter.title" :key="parameter.index"
                      :prop="parameter.field" :rules="parameter.rules" v-show="!parameter.hide">
          <template v-if="parameter.type == 'input'">
            <el-input v-model="editForm[parameter.field]"></el-input>
          </template>
          <template v-else-if="parameter.type == 'tree'">
            <el-input v-model="editForm[parameter.field]"></el-input>
          </template>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="editVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>
  </div>

</template>

<script>
  export default {
    data () {
      return {
        baseUrl: this.$route.query.baseUrl, // 基础url
        tableData: [], // 表格数据
        tableAttr: [], // 表格参数
        search: [], // 搜索内容
        total: 0, // 数据总数
        currentPage: 1, // 当前页码
        pageSize: 10, // 每页显示数量
        editVisible: false, // 是否显示编辑框
        editAttr: [], // 编辑框参数  目前设计的为每次点击都需要重新加载
        editForm: {},
        editFormRules: {},
        ids: [], // 页面选择的数据id
        selects: {} // 数据字典保存位置
      }
    },
    created () {
      this.getTableAttr().then(() => {
        this.getTableData()
      }).then(() => {
        this.initSearch()
      })
    },
    methods: {
      /* 获取列表参数 */
      async getTableAttr () {
        const { data: res } = await this.$http.get(this.baseUrl + '/getPageAttr')
        if (res.code === 200) {
          this.tableAttr = res.data
          await this.initSelect(this.tableAttr.columns)
        } else {
          this.$message.error(res.msg)
        }
      },
      /* 获取列表数据 */
      async getTableData () {
        const { data: res } = await this.$http.post(this.baseUrl + '/getAll',
          {
            pageNumber: this.currentPage,
            pageSize: this.pageSize,
            search: this.search
          }
        )
        if (res.code === 200) {
          this.total = res.data.total
          this.tableData = res.data.rows
          this.dataTransform() // 将select的内容转换
        } else {
          this.$message.error(res.msg)
        }
      },
      /* 将数据字典的值进行转换 */
      dataTransform () {
        for (const tableAttr of this.tableAttr.columns) {
          const type = tableAttr.type
          switch (type) {
            case 'tree':
              for (const tableData of this.tableData) {
                tableData[tableAttr.field] = this.getTransformValue(tableAttr.field, tableData[tableAttr.field])
              }
          }
        }
      },
      /* 获取数据字典对应的值 */
      getTransformValue (field, value) {
        const selects = this.selects[field]
        for (const select of selects) {
          if (select.id === value) {
            return select.name
          }
        }
        return null
      },
      /* 初始化数据字典 */
      initSelect (tableAttrs) {
        for (const tableAttr of tableAttrs) {
          const type = tableAttr.type
          switch (type) {
            case 'tree':
              this.getSelect(tableAttr)
          }
        }
      },
      /* 获取数字字典 */
      async getSelect (table) {
        if (Object.prototype.hasOwnProperty.call(table, 'url') && table.url !== null && table.url.length !== 0) {
          const { data: res } = await this.$http.get(table.url)
          if (res.code === 200) {
            this.selects[table.field] = res.data
          }
        }
      },
      /* 初始化搜索栏 */
      initSearch () {
        const searchs = []
        this.tableAttr.columns.forEach(column => {
          if (column.search) {
            const search = {
              name: column.field,
              value: null,
              rule: 1,
              title: column.title
            }
            searchs.push(search)
          }
          this.search = searchs
        })
      },
      /* 搜索 */
      searchTable () {
        this.getTableData()
      },
      /* 修改每页显示条数 */
      editPageSize (val) {
        this.pageSize = val
        this.getTableData()
      },
      /* 修改页码 */
      editPageNumber (val) {
        this.currentPage = val
        this.getTableData()
      },
      /* 打开编辑框 */
      async addTableData () {
        this.editVisible = true
        await this.getEditAttr()
      },
      checkboxData (selectData) {
        this.ids = []
        selectData.forEach(data => {
          this.ids.push(data.primaryKey)
        })
      },
      async editTableData () {
        this.editVisible = true
        if (this.ids.length !== 1) {
          this.editVisible = false
          this.$message.error('未选择数据')
          return
        }
        await this.getEditAttr(this.ids[0])
      },
      /* 删除数据 */
      async delTableData () {
        await this.$http.delete(this.baseUrl + '/del', { params: { ids: this.ids.join(',') } })
        await this.getTableData()
        console.log(this.ids)
      },
      /* 关闭编辑框 */
      closeEditPage () {
        this.editVisible = false
        this.editAttr = []
        this.editFormRules = {}
        this.editForm = {}
      },
      /* 获取编辑页面参数 */
      // TODO 需要重新整理from菜单 当前的办法太笨啦
      async getEditAttr (primaryKey) {
        const { data: res } = await this.$http.get(this.baseUrl + '/getEditAttr', { params: { primaryKey: primaryKey } })
        if (res.code === 200) {
          this.editAttr = []
          this.editForm = {}
          res.data.columns.forEach(attr => {
            const rules = this.buildUpRules(attr.rules, attr.title)
            this.$set(this.editForm, attr.field, attr.value)
            const formItem = {
              title: attr.title,
              field: attr.field,
              rules: rules,
              hide: attr.hide,
              type: attr.type
            }
            this.editAttr.push(formItem)
          })
        } else {
          this.$message.error(res.msg)
        }
      },
      /* 封装校验规则 */
      buildUpRules (rule, name) {
        const rules = []
        if (rule.required) {
          rules.push({
            type: rule.type,
            required: rule.required,
            message: '请输入' + name,
            trigger: 'blur'
          })
        }
        if (Object.prototype.hasOwnProperty.call(rule, 'min') &&
          Object.prototype.hasOwnProperty.call(rule, 'max')) {
          rules.push({
            type: rule.type,
            min: rule.min,
            max: rule.max,
            message: '请输入' + rule.min + '到' + rule.max + '位的字符',
            trigger: 'blur'
          })
        } else if (Object.prototype.hasOwnProperty.call(rule, 'min')) {
          rules.push({
            type: rule.type,
            min: rule.min,
            message: '最少输入' + rule.min + '位的字符',
            trigger: 'blur'
          })
        } else if (Object.prototype.hasOwnProperty.call(rule, 'max')) {
          rules.push({
            type: rule.type,
            max: rule.max,
            message: '最多输入' + rule.max + '位的字符',
            trigger: 'blur'
          })
        }
        return rules
      },
      // 提交表单
      submitForm () {
        // 验证表单
        this.$refs.editFormRef.validate(async valid => {
          if (!valid) {
            return
          }
          const { data: res } = await this.$http.post(this.baseUrl + '/edit', this.editForm)
          if (res.code === 200) {
            this.closeEditPage()
            await this.getTableData()
          }
        })
      }
    }
  }
</script>

<style lang="less" scoped>

  .search-from, .table-list {
    width: 90%;
    margin-left: 5%;
    padding-top: 20px;
    /*border: 1px solid #000000;*/

    .el-form-item {
      margin-bottom: 0;
    }
  }

  .function-button {
    width: 100%;
    margin-bottom: 10px;
    /*border: 1px solid #000000;*/
  }

  .page-number {
    height: 30px;
    width: 100%;
    margin-top: 20px;
    /*border: 1px solid #000000;*/

    .el-pagination {
      text-align: center;
    }
  }

  .main {
    height: 100%;
    width: 100%;
  }

</style>
