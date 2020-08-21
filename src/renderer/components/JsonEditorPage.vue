<template>
    <div id="json-editor" style="width: 100%; min-height: 400px;height: 99%"></div>
</template>

<script>
import JSONEditor from 'jsoneditor'
import 'jsoneditor/dist/jsoneditor.min.css'
import templates from '../assets/JsonEditor/templates'
import dataClassifyListSchemaRef from '../assets/JsonEditor/schema-ref-data-classify-list'
import paramGroupTypeListSchemaRef from '../assets/JsonEditor/schema-ref-param-group-type-list'
import schema from '../assets/JsonEditor/schema'
import autocompleted from '../assets/JsonEditor/auto-complete'
export default {
  name: 'JsonEditorPage',
  props: ['jsonChange'],
  data () {
    return {
      editor: null,
      updatedJson: {}
    }
  },
  mounted () {
    this.initJsonEditor()
  },
  methods: {
    editorChange () {
      if (this.jsonChange) { this.jsonChange(this.editor.get()) }
    },
    setJson (json) {
      this.editor.set(json)
    },
    getJson () {
      // get json
      this.updatedJson = this.editor.get()
      return this.updatedJson
    },
    initJsonEditor () {
    // create the editor
      let $this = this
      // const Ajv = require('ajv')

      const container = document.getElementById('json-editor')
      const options = {
        mode: 'tree',
        error: function (err) {
          alert(err.toString())
        },
        templates: templates,
        schema: schema,
        schemaRefs: {
          'dataClassifyList': dataClassifyListSchemaRef,
          'paramGroupTypeList': paramGroupTypeListSchemaRef
        },
        // ajv: Ajv({ allErrors: true, verbose: true }),
        autocomplete: {
          getOptions: function () {
            return autocompleted()
          }
        },
        change: function () {
          $this.editorChange()
        }}

      // set json
      const initialJson = {
        'dataClassifyList': [
          {
            'dataClassifyID': '',
            'dataClassifyName': '',
            'attrList': [],
            'enumList': []
          }
        ],
        'paramGroupTypeList': [
          {
            'paramGroupType': '',
            'paramGroup': [],
            'relationshipGroup': [],
            'availableTimesRules': [],
            'multiParamRules': []
          }
        ]
      }
      this.editor = new JSONEditor(container, options, initialJson)
    }
  }
}
</script>

<style scoped>

</style>
