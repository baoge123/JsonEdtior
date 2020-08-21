import MD5 from 'md5'
import axios from 'axios'

/**
 * This is just a simple version of deep copy
 * Has a lot of edge cases bug
 * If you want to use a perfect deep copy, use lodash's _.cloneDeep
 * @param {Object} source
 * @returns {Object}
 */
export function deepClone (source) {
  if (!source && typeof source !== 'object') {
    throw new Error('error arguments', 'deepClone')
  }
  const targetObj = source.constructor === Array ? [] : {}
  Object.keys(source).forEach(keys => {
    if (source[keys] && typeof source[keys] === 'object') {
      targetObj[keys] = deepClone(source[keys])
    } else {
      targetObj[keys] = source[keys]
    }
  })
  return targetObj
}

/**
* @ 全角转半角
* */
export function ToCDB (str) {
  let tmp = ''
  for (var i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 65248 && str.charCodeAt(i) < 65375) {
      tmp += String.fromCharCode(str.charCodeAt(i) - 65248)
    } else {
      tmp += String.fromCharCode(str.charCodeAt(i))
    }
  }
  return tmp
}

/**
 * @ 半角转全角
 * */
// export function ToDBC (str) {
//   let tmp = ''
//   for (let i = 0; i < str.length; i++) {
//     if (str.charCodeAt(i) === 32) {
//       tmp = tmp + String.fromCharCode(12288)
//     } else if (str.charCodeAt(i) < 127) {
//       tmp = tmp + String.fromCharCode(str.charCodeAt(i) + 65248)
//     }
//   }
//   return tmp
// }

/******************************************************************************
 * switchLanguages(from,to,query,all)
 *from : 指定的语言
 *to:   翻译指定的语言
 *query:需要翻译的字符串文本
 *all:  翻译完需要映射到的对象
 *
 *
 *
 * @版本:1.0
 * @修改时间:2019/10/18
 *
 *****************************************************************************/
export function BaiduTranslate (from, to, query) {
  const appid = '20191018000342500'
  const salt = '1435660288'
  const key = 'XZstNKy8NF63lxLKfo6J'
  const sign = MD5(appid + query + salt + key)
  return axios.get('http://api.fanyi.baidu.com/api/trans/vip/translate', {
    params: {
      q: query,
      appid: appid,
      salt: salt,
      from: from,
      to: to,
      sign: sign
    }
  })
}
