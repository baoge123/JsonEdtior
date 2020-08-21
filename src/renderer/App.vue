<template>
  <div id="app">
    <el-menu :router="true" :default-active="'/'" class="el-menu-demo">
      <el-menu-item index="/">参数分组模型</el-menu-item>
      <el-menu-item index="/xls">参数解析模型</el-menu-item>
    </el-menu>
    <router-view></router-view>
  </div>
</template>
<script>
export default {
  name: 'jsonbuilder',
  activated () {
    console.log(1)
    console.log(this.$route.path)
  }
}
</script>

<style scoped>
.el-menu-item {
  float: left;
  box-sizing: border-box;
  height: 40px;
  line-height: 40px;
}
</style>
