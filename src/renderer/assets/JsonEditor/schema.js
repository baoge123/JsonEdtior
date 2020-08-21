const schema = {
  'title': 'ParamModel',
  'description': 'Object containing param model details',
  'type': 'object',
  'properties': {
    'dataClassifyList': {
      '$ref': 'dataClassifyList'
    },
    'paramGroupTypeList': {
      '$ref': 'paramGroupTypeList'
    }
  },
  'required': ['dataClassifyList', 'paramGroupTypeList']
}

export default schema
