<template>
  <el-container class="window-box">
    <div class="tooltip-box" style="text-align: right;">
      <el-tooltip class="item" effect="dark" content="打开" placement="bottom">
        <el-button type="info" icon="el-icon-folder-opened" circle @click="openFile"></el-button>
      </el-tooltip>
      <el-tooltip class="item" effect="dark" content="保存" placement="bottom">
        <el-button type="success" icon="el-icon-takeaway-box" circle @click="saveFile"></el-button>
      </el-tooltip>
    </div>
    <el-header>
      <el-tabs v-model="activeTab" v-if="jsonAry.length">
        <el-tab-pane v-for="(item, index) of jsonAry" :key="item.dataFields[0].devType" :name="index.toString()" :label="item.dataFields[0].devType"></el-tab-pane>
      </el-tabs>
    </el-header>
    <el-container class="content">
      <div v-if="nodata" class="nodata">
        <p>请选择一个Excel文件！</p>
        <small>(支持多个设备，数据为4列, 英文名配置在static目录的xlsx文件内)</small>
      </div>
      <template v-else>
        <el-aside>
          <json-editor-page ref="jsonEditor" :jsonChange="handleJsonChange"></json-editor-page>
        </el-aside>
        <el-main>
          <json-viewer :value="jsonActive" :expand-depth=10 boxed copyable></json-viewer>
        </el-main>
      </template>
    </el-container>
  </el-container>
</template>

<script>
import fs from 'fs'
import { deepClone, ToCDB } from '../../utils'
import xlsx from 'node-xlsx'
import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.min.css'
import JsonEditorPage from '../components/JsonEditorPage'
import JsonViewer from 'vue-json-viewer'
import 'vue-json-viewer/style.css'
// import fs from 'fs'
const { dialog } = require('electron').remote
export default {
  name: 'xlstojson',
  data () {
    return {
      list: null,
      defaultJson: {
        frameModelId: '',
        dataFields: [{
          devType: 'Dev_Name',
          attrList: [],
          enumList: [],
          cmdList: []
        }],
        frames: [{
          attrList: [],
          bidList: [],
          dataType: '',
          filedType: '',
          fragJointer: '',
          frameEncoder: '',
          frameType: ''
        }]
      },
      jsonAry: [],
      nameMap: new Map(),
      activeTab: '0',
      viewer: null
    }
  },
  watch: {
    // 选择了tab
    activeTab () {
      this.$refs.jsonEditor.setJson(this.jsonActive)
    },
    // 处理数据
    list () {
      if (this.list && this.list.length) {
        this.convertJson()
      }
    }
  },
  components: {
    JsonEditorPage,
    JsonViewer
  },
  mounted () {
    // 打开翻译对照表 存成map
    let enNameList = xlsx.parse('./static/ChEnMap.xlsx')
    for (let item of enNameList[0].data) {
      this.nameMap.set(item[0], item[1])
    }
    // 注册Json编辑器
    this.viewer = new JSONEditor(this.$refs.jsonEditor, {
      mode: 'preview'
    }, {})
  },
  computed: {
    // 没有数据
    nodata () {
      return this.jsonAry.length <= 0
    },
    // 显示的json
    jsonActive () {
      let json = {}
      if (this.jsonAry.length > 0) {
        let tab = parseInt(this.activeTab)
        if (!isNaN(tab)) {
          json = this.jsonAry[tab]
        }
      }
      return json
    }
  },
  methods: {
    // 编辑json
    handleJsonChange (json) {
      let tab = parseInt(this.activeTab)
      if (!isNaN(tab)) {
        let jsonAry = deepClone(this.jsonAry)
        jsonAry[tab] = json
        this.jsonAry = jsonAry
      }
    },
    // 打开文件
    openFile () {
      let that = this
      let option = {
        filters: [
          { name: 'xls', extensions: ['xls', 'xlsx'] }
        ]
      }
      dialog.showOpenDialog(option, function (filePaths) {
        if (filePaths && filePaths.length) {
          let sheetList = xlsx.parse(filePaths[0])
          // 所有需要翻译的名称
          // let arr = []
          // for (let item of sheetList[0].data) {
          //   if (item[1]) {
          //     arr.push(item[1])
          //   }
          // }
          // console.log(arr.join('\n'))
          that.list = sheetList[0].data
        }
      })
    },
    // 保存文件
    saveFile () {
      const path = require('path')

      this.jsonAry.forEach(json => {
        console.log(json)
        let filePath = path.join(__dirname, 'dist/' + json.dataFields[0].devType + '.json') // 需要复制文件的路径
        let options = {
          title: '保存Json文件',
          defaultPath: filePath,
          filters: [
            { name: 'Json', extensions: ['json', 'txt'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        }

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
      })
    },
    // 处理文件
    convertJson () {
      let jsonAry = []
      let i = null
      console.log(this.list)
      this.list.forEach((item, index) => {
        if (item[0] && (item[0] === '数据部分' || item[0] === '链路数')) {
        } else {
          // 需要的列 如果有标题 创建实体
          if (item[0] && item[0].includes('数据部分')) {
            i = i === null ? 0 : i + 1
            jsonAry[i] = deepClone(this.defaultJson)
            let name = '未知'
            if (item[0].includes('天线')) {
              name = 'ACU'
            }
            if (item[0].includes('功放')) {
              name = 'PA'
            }
            if (item[0].includes('功放切换开关')) {
              name = 'PASW'
            }
            if (item[0].includes('插箱')) {
              name = 'PWM'
            }
            if (item[0].includes('基带下变频')) {
              name = 'TDDC'
            }
            if (item[0].includes('基带设备')) {
              name = 'TBB'
            }
            jsonAry[i].dataFields[0].devType = name
          }
          // 如果是新的子项 排除一些不要的
          if (item[1] && item[1] !== '…' && !item[1].includes('n编号') && !item[1].includes('n的')) {
            // id
            if (item[1] === '开始标识') {
              let child = {}
              child.id = 'start'
              child.desc = item[1]
              child.dataType = 'byte'
              child.displayFormat = 'hex'
              child.pid = ''
              jsonAry[i].dataFields[0].attrList.push(child)
            } else if (item[1] === '数据长度') {
              let child = {}
              child.id = 'length'
              child.desc = item[1]
              child.dataType = 'short'
              child.displayFormat = 'float'
              child.pid = ''
              jsonAry[i].dataFields[0].attrList.push(child)
            } else if (item[1].includes('设备1编号')) {
              let child = {}
              child.id = 'dev_code'
              child.desc = item[1].replace(/1/g, '')
              child.dataType = 'uint'
              child.displayFormat = 'string'
              child.pid = ''
              jsonAry[i].dataFields[0].attrList.push(child)
            } else {
              let itemid = this.nameMap.get(item[1].trim()) || 'Null'
              // 往下查找 是否有
              let childeContentAry = '' // 第三格说明所有行
              for (let i = 0; i < this.list.length; i++) {
                let titem = this.list[index + i]
                if (titem) {
                  childeContentAry += titem[3]
                }
                if (!titem || !this.list[index + i + 1] || this.list[index + i + 1][1]) {
                  break
                }
              }
              // 所有说明文字
              // 正则匹配是否有b0 b1 b2 b3 b4
              childeContentAry = ToCDB(childeContentAry)
              let bAry = childeContentAry.match(new RegExp(/b\d:/g))
              // 有 b0 b1 b2
              if (bAry) {
                let fatherDesc = item[1]
                let child = {}
                child.id = itemid + '_bit'
                child.desc = fatherDesc
                child.dataType = 'byte'
                child.displayFormat = 'string'
                child.pid = ''
                jsonAry[i].dataFields[0].attrList.push(child)
                // 创建多个b0
                let valueAry = []
                let bindexAry = []
                for (let b of bAry) {
                  // eslint-disable-next-line no-eval
                  let reg = eval(`/${b}/`)
                  let indexAry = childeContentAry.match(reg)
                  bindexAry.push(indexAry.index)
                }
                bindexAry.forEach((item, index) => {
                  let nextindex = bindexAry[index + 1] || childeContentAry.length
                  valueAry.push(childeContentAry.substring(item + 3, nextindex))
                })
                child.id = itemid + '_bit'
                // console.log(valueAry)
                // b0 b1 对应的结果  保留不显示 可能是名称 接着是 枚举
                valueAry.forEach((item, index) => {
                  if (!item.includes('预留') && !item.includes('保留')) {
                    // console.log(item)
                    let beindex = item.match(new RegExp(/\d=/)) || item.match(new RegExp(/\d:/))
                    if (!beindex) {
                      beindex = { index: 0 }
                    }
                    // B项名称
                    let bname = item.substring(0, beindex.index).trim().replace(/ /g, '')
                    // console.log(bname)
                    // let enumMap = []
                    // 枚举部分
                    let enumstr = item.substring(beindex.index, item.length).replace(/,/g, '')
                    // console.log(enumstr)
                    // 识别枚举
                    let enumNameAry = enumstr.match(/\d:/g) || enumstr.match(/\d=/g)
                    let enumIndexAry = []
                    let enumAry = []
                    enumNameAry.forEach((item2) => {
                      // eslint-disable-next-line no-eval
                      let reg = eval(`/${item2}/`)
                      let indexAry = enumstr.match(reg)
                      enumIndexAry.push(indexAry.index)
                    })
                    enumIndexAry.forEach((item3, index3) => {
                      let nnindex = enumIndexAry[index3 + 1] || enumstr.length
                      enumAry.push({
                        svalue: enumNameAry[index3].replace(/:/g, '').replace(/=/g, ''),
                        uvalue: enumNameAry[index3].replace(/:/g, '').replace(/=/g, ''),
                        desc: enumstr.substring(item3 + enumNameAry[0].length, nnindex)
                      })
                    })
                    // console.log
                    // 加入元素
                    let itemName = bname.length ? bname : fatherDesc + bAry[index].replace(/:/g, '')
                    let itemId = itemid + '_' + bAry[index].replace(/:/g, '')
                    let echild = {}
                    echild.id = itemId
                    echild.desc = itemName
                    echild.dataType = 'byte'
                    echild.displayFormat = 'enum|' + itemId
                    echild.pid = ''
                    jsonAry[i].dataFields[0].attrList.push(echild)
                    // 加入枚举
                    let eechild = {}
                    eechild.name = itemId
                    eechild.desc = itemName
                    eechild.entryList = enumAry
                    jsonAry[i].dataFields[0].enumList.push(eechild)
                  }
                })
              } else {
                let allrowinfostr = childeContentAry.replace(/\(.+\)/g, '').replace(/0:无此参数/g, '')
                // 判断是否是纯枚举 跟踪频段：0x30=Q频段1，0x31=Q频段2，0x32=停止（跟踪模式下有效，其它模式固定为停止状态） ||  0：无此参数；N=1~10代表n*1.023Mcps
                let onlyEnumAry = allrowinfostr.match(/[0-9]x[0-9][0-9]=/g) || allrowinfostr.match(/[0-9]x[0-9][0-9]:/g) || allrowinfostr.match(/[0-9]:/g) || allrowinfostr.match(/[0-9]x[0-9][0-9]/g)
                if (onlyEnumAry && parseInt(item[2]) !== 8) {
                  // eslint-disable-next-line no-eval
                  let eindex = allrowinfostr.match(eval(`/${onlyEnumAry[0]}/`))
                  if (!eindex) {
                    eindex = { index: 0 }
                  }
                  // desc
                  let name = allrowinfostr.substring(0, eindex.index).trim().replace(/ |:|;/g, '')
                  // console.log(name)
                  let indexAry = []
                  let valueAry = []
                  let enumAry = []
                  onlyEnumAry.forEach((keyitem) => {
                    // eslint-disable-next-line no-eval
                    let eeindex = allrowinfostr.match(eval(`/${keyitem}/`))
                    indexAry.push(eeindex.index)
                  })
                  // 分隔
                  indexAry.forEach((item, index) => {
                    let endindex = indexAry[index + 1] ? indexAry[index + 1] : allrowinfostr.length
                    valueAry.push(allrowinfostr.slice(item, endindex))
                  })
                  // 用: 或者=分隔 加入枚举
                  valueAry.forEach((item, index) => {
                    enumAry.push({
                      svalue: onlyEnumAry[index].replace(/=|:/g, ''),
                      uvalue: onlyEnumAry[index].replace(/=|:/g, ''),
                      // eslint-disable-next-line no-eval
                      desc: item.replace(eval(`/${onlyEnumAry[index]}/g`), '').replace(/ |,|。|;/g, '')
                    })
                  })
                  // 加入元素
                  let itemName = name.length ? name : item[1]
                  let itemid = this.nameMap.get(item[1].trim()) || 'Null'
                  let echild = {}
                  echild.id = itemid
                  echild.desc = itemName
                  echild.dataType = 'byte'
                  echild.displayFormat = 'enum|' + itemid
                  echild.pid = ''
                  jsonAry[i].dataFields[0].attrList.push(echild)
                  // 加入枚举
                  let eechild = {}
                  eechild.name = itemid
                  eechild.desc = itemName
                  eechild.entryList = enumAry
                  jsonAry[i].dataFields[0].enumList.push(eechild)
                } else {
                  // 排除掉无效的
                  if (childeContentAry === '天线套数' || childeContentAry === '保留') { } else {
                    let removeTrimStr = childeContentAry.replace(/ /g, '')
                    // 如果有 ~ 又有精度和范围
                    if (removeTrimStr.match(/\d~\d/) && removeTrimStr.match(/精度|范围/)) {
                      // console.log(removeTrimStr)
                      let range = removeTrimStr.match(/[+|-]?\d?\d?.?\d+~[+|-]?\d?\d?.?\d+/)
                      let valueStr = range[0].replace(/围|:/g, '')
                      let minmaxAry = valueStr.split('~')
                      let itemName = item[1]
                      let itemid = this.nameMap.get(item[1].trim()) || 'Null'
                      let unit = removeTrimStr.match(/:帧|:字|:b\/s|:副帧|:bit|1Hz|V/)
                      let step = removeTrimStr.match(/0.001|0.01/)
                      let datatype = 'int'
                      if (item[2] === 4) {
                        datatype = 'int'
                        if (parseInt(minmaxAry[0]) >= 0) {
                          datatype = 'uint'
                        }
                      } else if (item[2] === 2) {
                        datatype = 'short'
                      } else {
                        datatype = 'byte'
                      }
                      let echild = {}
                      echild.id = itemid
                      echild.desc = itemName
                      echild.dataType = datatype
                      echild.displayFormat = step ? 'float' : ''
                      echild.minValue = minmaxAry[0]
                      echild.maxValue = minmaxAry[1]
                      echild.unit = unit ? unit[0].replace(/:|1/g, '') : ''
                      echild.step = step ? step[0].toString() : ''
                      jsonAry[i].dataFields[0].attrList.push(echild)
                      // console.log(echild)
                    } else {
                      // 其他范围 -1.000°~ 1.000°  -45~90  0~160 30.0~55.0 -30.0~10 30.0~55.0 0~30  2000.000~2100.000 -10000mV~10000mV
                      // 排除 0:无此参数;N=1~10
                      let removeTrimStr = childeContentAry.replace(/ /g, '')
                      let range = removeTrimStr.match(/[-]?\d+?.?\d+[mV|°]?~\d+?.?\d+[mV|°]?/) || removeTrimStr.match(/[-]?\d+mV~\d+mV/) || (removeTrimStr.match(/0:|N=/) ? null : removeTrimStr.match(/[-]?\d+~\d+/))
                      if (range) {
                        let valueStr = range[0].replace(/mV|°/g, '')
                        let minmaxAry = valueStr.split('~')
                        let itemName = item[1]
                        let itemid = this.nameMap.get(item[1].trim()) || 'Null'
                        let unit = removeTrimStr.match(/℃|°|0.1A|0.1dBm|1dB|MHz|1mV/)
                        let stepStr = minmaxAry[0].match(/.\d+/)
                        let step = null
                        if (stepStr) {
                          let stepCount = stepStr[0].replace(/./g, '').length
                          let nstep = '0.'
                          for (let i = 0; i < stepCount - 1; i++) {
                            nstep += '0'
                          }
                          nstep += '1'
                          step = nstep
                        }
                        let datatype = 'int'
                        if (item[2] === 4) {
                          datatype = 'int'
                          if (parseInt(minmaxAry[0]) >= 0) {
                            datatype = 'uint'
                          }
                        } else if (item[2] === 2) {
                          datatype = 'short'
                        } else {
                          datatype = 'byte'
                        }
                        let echild = {}
                        echild.id = itemid
                        echild.desc = itemName
                        echild.dataType = datatype
                        echild.displayFormat = step ? 'float' : ''
                        echild.minValue = minmaxAry[0]
                        echild.maxValue = minmaxAry[1]
                        echild.unit = unit ? unit[0] : ''
                        echild.step = step || ''
                        jsonAry[i].dataFields[0].attrList.push(echild)
                        // console.log(echild)
                      } else {
                        // 单位：
                        let removeTrimStr = childeContentAry.replace(/ /g, '')
                        let unitMatch = removeTrimStr.match(/:Hz|:mV|:0.1dBHz|:0.01Hz|:0.1dB/)
                        if (unitMatch) {
                          let itemName = item[1]
                          let itemid = this.nameMap.get(item[1].trim()) || 'Null'
                          let datatype = 'int'
                          if (item[2] === 4) {
                            datatype = 'int'
                          } else if (item[2] === 2) {
                            datatype = 'short'
                          } else {
                            datatype = 'byte'
                          }
                          let echild = {}
                          echild.id = itemid
                          echild.desc = itemName
                          echild.dataType = datatype
                          echild.displayFormat = ''
                          echild.unit = unitMatch[0]
                          jsonAry[i].dataFields[0].attrList.push(echild)
                          // console.log(echild)
                        } else {
                          // 速度值:
                          if (childeContentAry.includes('速度值:')) {
                            let itemName = item[1]
                            let itemid = this.nameMap.get(item[1].trim()) || 'Null'
                            let datatype = 'int'
                            if (item[2] === 4) {
                              datatype = 'int'
                            } else if (item[2] === 2) {
                              datatype = 'short'
                            } else {
                              datatype = 'byte'
                            }
                            let echild = {}
                            echild.id = itemid
                            echild.desc = itemName
                            echild.dataType = datatype
                            echild.displayFormat = 'float'
                            jsonAry[i].dataFields[0].attrList.push(echild)
                            // console.log(echild)
                          } else {
                            // 还有些枚举
                            let removeTrimStr = childeContentAry.replace(/ /g, '')
                            let enumAry = removeTrimStr.match(/[0-9]:/g) || removeTrimStr.match(/[0-9]\./g) || removeTrimStr.match(/[0-9]-/g)
                            let enumarr = enumAry ? Array.from(new Set(enumAry)) : []
                            if (enumarr.length > 1) {
                              let indexarr = []
                              enumarr.forEach((item5, index) => {
                                // eslint-disable-next-line no-eval
                                let tindex = removeTrimStr.match(eval(`/${item5}/`))
                                indexarr[index] = tindex.index
                              })
                              let valuestrarr = []
                              indexarr.forEach((item5, index) => {
                                let nextindex = index + 1 > indexarr.length - 1 ? null : index + 1
                                valuestrarr[index] = removeTrimStr.slice(item5, nextindex ? indexarr[nextindex] : removeTrimStr.length)
                              })
                              let enums = []
                              valuestrarr.forEach((item5) => {
                                let keyvalue = item5.split(':')
                                if (keyvalue.length < 2) {
                                  keyvalue = item5.split('.')
                                }
                                if (!keyvalue.length < 2) {
                                  keyvalue = item5.split('-')
                                }
                                enums.push([keyvalue[0], keyvalue[1]])
                              })
                              let enumlistAry = []
                              enums.forEach((item5) => {
                                enumlistAry.push({
                                  svalue: item5[0],
                                  uvalue: item5[0],
                                  desc: item5[1]
                                })
                              })
                              // 加入元素
                              let itemName = item[1]
                              let itemid = this.nameMap.get(item[1].trim()) || 'Null'
                              let echild = {}
                              echild.id = itemid
                              echild.desc = itemName
                              echild.dataType = 'byte'
                              echild.displayFormat = 'enum|' + itemid
                              echild.pid = ''
                              jsonAry[i].dataFields[0].attrList.push(echild)
                              // 加入枚举
                              let eechild = {}
                              eechild.name = itemid
                              eechild.desc = itemName
                              eechild.entryList = enumlistAry
                              jsonAry[i].dataFields[0].enumList.push(eechild)
                              // console.log(echild, eechild)
                            } else {
                              // 其他
                              console.log(item)
                              console.log(childeContentAry)
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })
      this.activeTab = '0'
      this.jsonAry = jsonAry
      console.log(jsonAry)
    }
  }
}
</script>

<style scoped>
.el-header {
  padding-left: 10px;
}
.window-box {
  width: 100%;
  height: calc(100% - 30px);
  position: fixed;
}
.tooltip-box {
  height: auto !important;
  position: absolute;
  top: -25px;
  right: 30px;
}
.content {
  width: calc(100% - 20px) !important;
}
.content .el-main {
  padding: 0 0 20px;
}
.content .el-aside {
  width: 40% !important;
  padding-bottom: 15px;
}
.nodata {
  width: 100%;
  height: 90px;
  margin-top: 12%;
  display: inline-block;
  color: #333;
  text-align: center;
}
.nodata p {
  font-size: 17px;
}
.nodata small {
  font-size: 14px;
  color: #999;
}
</style>
