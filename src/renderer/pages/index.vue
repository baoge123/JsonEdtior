<template>
  <el-container class="window-box">
    <!--左边容器111111 -->
    <el-aside class="aside">
      <json-editor-page ref="jsonEditor" :jsonChange="jsonChange"></json-editor-page>
    </el-aside>
    <!-- 右边容器111 -->
    <el-container>
      <div class="resize-container"></div>
      <el-main class="main">
        <el-header style="text-align: right;">
          <el-tooltip class="item" effect="dark" content="打开" placement="bottom">
            <el-button type="info" icon="el-icon-folder-opened" circle @click="openFile"></el-button>
          </el-tooltip>
          <el-tooltip class="item" effect="dark" content="保存" placement="bottom">
            <el-button type="success" icon="el-icon-takeaway-box" circle @click="saveFile"></el-button>
          </el-tooltip>
<!--          <el-tooltip class="item" effect="dark" content="设置" placement="bottom">-->
<!--            <el-button type="primary" icon="el-icon-setting" circle></el-button>-->
<!--          </el-tooltip>-->
        </el-header>
        <div class="middle">
          <div id="json-viewer"><json-viewer :value="jsonData" :expand-depth=10 boxed copyable></json-viewer></div>
        </div>
        <el-backtop target=".main"></el-backtop>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.min.css'
import JsonEditorPage from '../components/JsonEditorPage'
import fs from 'fs'
import dragControllerDiv from '../assets/drag'
import JsonViewer from 'vue-json-viewer'
import 'vue-json-viewer/style.css'
const { dialog } = require('electron').remote

export default {
  components: {
    JsonEditorPage, JsonViewer
  },
  data () {
    return {
      // viewer: null,
      jsonData: {}
    }
  },
  mounted () {
    dragControllerDiv()
    this.getChildData()
    // this.initJsonViewer()
  },
  methods: {
    jsonChange (json) {
      // let json = this.$refs.jsonEditor.getJson()
      console.log(json)
      // this.viewer.set(json)
      this.jsonData = json
    },
    openFile () {
      let option = {
        filters: [
          { name: 'Json', extensions: ['json', 'txt'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      }
      let $this = this
      dialog.showOpenDialog(option, function (filePaths) {
        if (filePaths.length > 0) {
          fs.readFile(filePaths[0], (err, data) => {
            if (err) alert(err)
            console.log(data.toString())
            try {
              $this.$refs.jsonEditor.setJson(JSON.parse(data.toString()))
              $this.jsonData = JSON.parse(data.toString())
              // $this.viewer.set(JSON.parse(data.toString()))
            } catch (e) {
              alert(e)
            }
          })
        }
      })
    },
    saveFile () {
      const path = require('path')
      let filePath = path.join(__dirname, 'dist/demo.json') // 需要复制文件的路径
      const options = {
        title: '保存Json文件',
        defaultPath: filePath,
        filters: [
          { name: 'Json', extensions: ['json', 'txt'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      }

      let json = this.$refs.jsonEditor.getJson()
      let jsonObj = JSON.stringify(json, null, 4)
      dialog.showSaveDialog(options, filename => {
        fs.writeFile(filename, jsonObj, function (err) {
          if (err) {
            console.log(err)
            alert(err)
          } else {
            alert('保存成功，路径：' + filename)
          }
        })
      })
    },
    getChildData () {
      this.jsonData = this.$refs.jsonEditor.getJson()
      // alert(JSON.stringify(json, null, 2))
    },
    initJsonViewer () {
      const container = document.getElementById('json-viewer')
      const options = {
        mode: 'preview'
      }
      this.viewer = new JSONEditor(container, options, this.jsonData)
    }
  }
}
</script>
<style scoped>
.resize-container:hover {
  cursor: w-resize;
}

.resize-container::after {
  content: "";
  display: inline-block;
  width: 2px;
  height: 20px;
  border-left: 1px solid rgba(0, 0, 0, 0.2);
  border-right: 1px solid rgba(0, 0, 0, 0.2);
  position: relative;
  top: 50%;
}

.window-box {
  width: 100%;
  height: calc(100% - 30px);
  position: fixed;
}

.el-main {
  padding: 0px;
}

.aside {
  border-right: 1px solid #e4e0e0;
  margin: 5px;
  overflow-y: overlay;
}

.aside::-webkit-scrollbar,
.main::-webkit-scrollbar {
  /*滚动条整体样式*/
  width: 5px; /*高宽分别对应横竖滚动条的尺寸*/
  height: 1px;
}

.aside::-webkit-scrollbar-thumb,
.main::-webkit-scrollbar-thumb {
  /*滚动条里面小方块*/
  border-radius: 10px;
  background-color: skyblue;
  background-image: -webkit-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.2) 75%,
    transparent 75%,
    transparent
  );
}

.aside::-webkit-scrollbar-track,
.main::-webkit-scrollbar-track {
  /*滚动条里面轨道*/
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  background: #ededed;
  border-radius: 10px;
}
.middle {
  width: 98%; min-height: 400px;height: 90%;margin-left: 10px;margin-right: 10px;
}
  #json-viewer{width: 100%; min-height: 400px;height: 100%}
</style>
