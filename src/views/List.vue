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
        <!-- TODO赶时间暂时写成固定的等有时间全部需要改成iframe模式的 -->
        <template v-for="button in buttons">
          <template v-if="button.buttonType == '0'">
            <el-button :key="button.menuId" type="primary" @click="addTableData">新增</el-button>
          </template>
          <template v-else-if="button.buttonType == '3'">
            <el-button :key="button.menuId" type="primary" @click="delTableData">删除</el-button>
          </template>
        </template>
      </div>
      <el-table :data="tableData"
                border
                style="min-width: 100%"
                @selection-change="checkboxData">
        <template v-for="header in tableAttr">
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
        <template v-if="tableButtons.length != 0">
          <el-table-column
            label="操作"
          >
            <template slot-scope="scope">
              <template v-for="button in tableButtons">
                <template v-if="button.buttonType == '1'">
                  <el-button :key="button.menuId" type="primary" icon="el-icon-edit" circle
                             @click="editTableData(scope.row.primaryKey)">
                  </el-button>
                </template>
                <template v-else-if="button.buttonType == '2'">
                  <el-button :key="button.menuId" type="danger" icon="el-icon-delete"
                             @click="delOenTableData(scope.row.primaryKey)" circle></el-button>
                </template>
                <template v-else-if="button.buttonType == '4'">
                  <el-button :key="button.menuId" type="primary" size="mini"
                             @click="jumpTabs(button,scope.row.primaryKey)">
                    {{button.name}}
                  </el-button>
                </template>
              </template>
            </template>
          </el-table-column>
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
          <template v-if="parameter.type === 'input'">
            <el-input v-model="editForm[parameter.field]"></el-input>
          </template>
          <template v-else-if="parameter.type === 'select'">
            <el-select v-model="editForm[parameter.field]"
                       placeholder="请选择"
                       size="medium"
                       ref="treeSelect"
                       :multiple="parameter.multiple"
                       clearable
            >
              <el-option
                v-for="select in selects[parameter.field]"
                :key="select.id"
                :label="select.name"
                :value="select.id">
              </el-option>
            </el-select>
          </template>
          <template v-else-if="parameter.type === 'tree'">
            <el-select v-model="editForm[parameter.field]"
                       placeholder="请选择"
                       size="medium"
                       ref="treeSelect"
                       :multiple="parameter.multiple"
                       clearable
                       @click.native="showTree(parameter.field,parameter.multiple)"
            >
              <el-option
                v-for="select in selects[parameter.field]"
                :key="select.id"
                :label="select.name"
                :value="select.id">
              </el-option>
            </el-select>
          </template>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="editVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>
    <!--tree页面展示区-->
    <el-dialog title="请选择" :visible="treeVisible" @close="closeTreePage">
      <el-tree :data="treeData"
               highlight-current
               check-strictly
               ref="tree"
               :show-checkbox="treeMultiple"
               node-key="id"
               :default-expanded-keys="defaultExpandedKeys"
      ></el-tree>
      <div slot="footer" class="dialog-footer">
        <el-button @click="treeVisible = false">取 消</el-button>
        <el-button type="primary" @click="setUpTree">确 定</el-button>
      </div>
    </el-dialog>
  </div>

</template>

<script>

  export default {
    data () {
      return {
        // 基础url
        serviceUrl: this.$route.query.serviceUrl,
        baseUrl: this.$route.query.baseUrl,
        menuId: this.$route.query.menuId,
        // 表格数据
        tableData: [],
        // 表格参数
        tableAttr: [],
        // 搜索内容
        search: [],
        // 过滤字段
        filterField: null,
        // 数据总数
        total: 0,
        // 当前页码
        currentPage: 1,
        // 每页显示数量
        pageSize: 10,
        // 是否显示编辑框
        editVisible: false,
        // 编辑框参数  目前设计的为每次点击都需要重新加载
        editAttr: [],
        // 提交的表单
        editForm: {},
        // 表单的校验规则
        editFormRules: {},
        // 页面选择的数据id
        ids: [],
        // 数据字典保存位置
        selects: {},
        // 是否显示tree选择页面
        treeVisible: false,
        // 是否支持树列表多选
        treeMultiple: false,
        // 列表树的数据
        treeData: [],
        // 树对应的字段
        treeField: null,
        // 默认展开的节点
        defaultExpandedKeys: [],
        // 页面按钮
        buttons: [],
        tableButtons: [],
        pid: this.$route.params.pid
      }
    },
    created () {
      this.getTableAttr().then(() => {
        this.getTableData()
      }).then(() => {
        this.initSearch()
      })
      this.getButtons()
    },
    methods: {
      getBaseUrl () {
        let url = ''
        if (this.serviceUrl !== null && typeof this.serviceUrl !== 'undefined' && this.serviceUrl.length !== 0) {
          url += this.serviceUrl
        }
        if (this.baseUrl !== null && this.baseUrl.length !== 0) {
          url += this.baseUrl
        }
        return url
      },
      /* 获取列表参数 */
      async getTableAttr () {
        if (this.menuId == null || this.menuId.length === 0) {
          return
        }
        const { data: res } = await this.$http.get(this.getBaseUrl() + '/getPageAttr')
        if (res.code === 200) {
          this.tableAttr = []
          for (const column of res.data.columns) {
            if (!column.hide) {
              this.tableAttr.push(column)
            }
          }
          await this.initSelect(this.tableAttr, false)
          await this.initFilterField(res.data.columns)
        } else {
          this.$message.error(res.msg)
        }
      },
      async getButtons () {
        const { data: res } = await this.$http.get('/system/sysService/getService/' + this.menuId)
        if (res.code === 200) {
          this.buttons = res.data
          this.tableButtons = []
          this.buttons.forEach(button => {
            // TODO
            if (button.buttonType === 1 || button.buttonType === 2 || button.buttonType === 4) {
              this.tableButtons.push(button)
            }
          })
        }
      },
      /* 获取列表数据 */
      async getTableData () {
        const searchs = []
        if (this.filterField != null) {
          searchs.push(this.filterField)
        }
        this.search.forEach(search => {
          searchs.push(search)
        })
        const { data: res } = await this.$http.post(this.getBaseUrl(),
          {
            pageNumber: this.currentPage,
            pageSize: this.pageSize,
            search: searchs
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
        for (const tableAttr of this.tableAttr) {
          const type = tableAttr.type
          switch (type) {
            case 'tree':
            case 'select':
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
        return value
      },
      /* 初始化过滤字段 */
      initFilterField (attrs) {
        for (const attr of attrs) {
          if (Object.prototype.hasOwnProperty.call(attr, 'filterField')) {
            const query = this.$router.history.current.query
            const newQuery = JSON.parse(JSON.stringify(query))
            const value = newQuery[attr.filterField]
            this.filterField = { // 搜索字段
              name: attr.field,
              // 搜索值
              value: value,
              // 匹配规则
              rule: 1,
              // 显示的名字
              title: attr.title
            }
          }
        }
      },
      /* 初始化数据字典 */
      async initSelect (attrs, mandatoryAcquisition) {
        for (const attr of attrs) {
          const type = attr.type
          switch (type) {
            case 'tree':
            case 'select':
              await this.getSelect(attr, mandatoryAcquisition)
          }
        }
      },
      /* 获取数字字典 */
      async getSelect (table, mandatoryAcquisition) {
        if (!mandatoryAcquisition && Object.prototype.hasOwnProperty.call(this.selects, table.field)) {
          return
        }
        if (Object.prototype.hasOwnProperty.call(table, 'url') && table.url !== null && table.url.length !== 0) {
          const url = this.formatUrl(table.url)
          const { data: res } = await this.$http.get(url)
          if (res.code === 200) {
            this.selects[table.field] = res.data.selects
          }
        }
      },
      formatUrl (url) {
        const reg = new RegExp('/{service}', 'g')// g代表全部
        const reg1 = new RegExp('{service}', 'g')// g代表全部
        url = url.replace(reg, this.serviceUrl)
        url = url.replace(reg1, this.serviceUrl)
        return url
      },
      /* 初始化搜索栏 */
      initSearch () {
        const searchs = []
        this.tableAttr.forEach(column => {
          if (column.search) {
            const search = {
              // 搜索字段
              name: column.field,
              // 搜索值
              value: null,
              // 匹配规则
              rule: 1,
              // 显示的名字
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
      async editTableData (primaryKey) {
        this.editVisible = true
        await this.getEditAttr(primaryKey)
      },
      /* 删除数据 */
      async delOenTableData (primaryKey) {
        await this.$http.delete(this.getBaseUrl() + '/del', { params: { ids: primaryKey } })
        // await this.$http.delete(this.baseUrl + '/del', { params: { ids: this.ids.join(',') } })
        await this.getTableData()
      },

      /* 删除数据 */
      async delTableData () {
        if (this.ids.length === 0) {
          return
        }
        await this.$http.delete(this.getBaseUrl() + '/del', { params: { ids: this.ids.join(',') } })
        await this.getTableData()
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
        const { data: res } = await this.$http.get(this.getBaseUrl() + '/getEditAttr', { params: { primaryKey: primaryKey } })
        if (res.code === 200) {
          this.editAttr = []
          this.editForm = {}
          res.data.columns.forEach(attr => {
            const rules = this.buildUpRules(attr.rules, attr.title)
            if (Object.prototype.hasOwnProperty.call(attr, 'pidField')) {
              const query = this.$router.history.current.query
              const newQuery = JSON.parse(JSON.stringify(query))
              attr.value = newQuery[attr.pidField]
            }
            this.$set(this.editForm, attr.field, attr.value)
            this.editAttr.push({
              title: attr.title,
              field: attr.field,
              rules: rules,
              hide: attr.hide,
              type: attr.type,
              multiple: attr.multiple
            })
          })

          await this.initSelect(res.data.columns, true)
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
          const { data: res } = await this.$http.post(this.getBaseUrl() + '/edit', this.editForm)
          if (res.code === 200) {
            this.closeEditPage()
            await this.getTableData()
          }
        })
      },
      showTree (field, multiple) {
        this.$refs.treeSelect.forEach((tree) => {
          tree.blur()
        })
        this.treeField = field
        this.treeData = this.getTreeData(field)
        this.treeMultiple = multiple
        this.treeVisible = true
        if (multiple) {
          this.$nextTick(function () {
            this.$refs.tree.setCheckedKeys(this.editForm[field])
            this.defaultExpandedKeys = this.editForm[field]
          })
        } else {
          this.$nextTick(function () {
            this.$refs.tree.setCurrentKey(this.editForm[field])
            this.defaultExpandedKeys = [this.editForm[field]]
          })
        }
      },
      closeTreePage () {
        this.treeVisible = false
        this.treeField = null
        this.treeData = []
      },
      getTreeData (field) {
        if (Object.prototype.hasOwnProperty.call(this.selects, field)) {
          return this.selectTransformTree(this.selects[field])
        }
        return {}
      },
      selectTransformTree (selects) {
        const treeData = []
        // 遍历获取第一级菜单
        for (const select of selects) {
          const currentNode = {
            id: select.id,
            label: select.name
          }
          if (!Object.prototype.hasOwnProperty.call(select, 'pid')) {
            treeData.push(currentNode)
          } else {
            let isPush = true
            for (const parentSelect of selects) {
              if (select.pid === parentSelect.id) {
                isPush = false
                break
              }
            }
            if (isPush) {
              treeData.push(currentNode)
            }
          }
        }
        for (const tree of treeData) {
          this.addChildren(selects, tree) // 添加子节点
        }
        return treeData
      },
      addChildren (selects, tree) {
        const childrens = []
        for (const select of selects) {
          if (select.pid === tree.id) {
            childrens.push({
              id: select.id,
              label: select.name
            })
          }
        }
        for (const children of childrens) {
          this.addChildren(selects, children) // 添加子节点
        }
        tree.children = childrens
      },
      // 设置选择的树列表数据
      setUpTree () {
        let value
        if (this.treeMultiple) {
          value = this.$refs.tree.getCheckedKeys(false)
          value = value.concat(this.$refs.tree.getHalfCheckedKeys())
          if (value.length === 0) {
            this.$message.error('未选择数据')
          }
        } else {
          const currentNode = this.$refs.tree.getCurrentNode()
          if (currentNode === null) {
            this.$message.error('未选择数据')
          } else {
            value = currentNode.id
          }
        }
        this.editForm[this.treeField] = value
        this.closeTreePage()
      },
      jumpTabs (button, pid) {
        const query = this.$router.history.current.query
        const path = this.$router.history.current.path
        const newQuery = JSON.parse(JSON.stringify(query))
        newQuery.baseUrl = button.url
        newQuery.menuId = button.menuId
        newQuery.pid = pid
        this.$router.push({
          path,
          query: newQuery
        })
        window.location.reload()
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
