const { textOutPut }  = require('./tool')

function getOutPut (elementInfo, styleList, domHtml, groupList, fileName, ind, node, query) {
  const WC = node.width - node.left - node.right
  const HC = node.height - node.top - node.bottom
  // 是背景吗
  const isBG = WC == 0 && HC == 0
  // 判断是否 配置了输出文字 并且此图层是文字
  if (JSON.parse(query.outText) && elementInfo.text) {
    [styleList, domHtml] = textOutPut(elementInfo.text, styleList, domHtml, groupList)
    
  } else { // 什么都不是那就输出成图片吧
    // 判断输出图形的形式
    if (query.output === 'background') {
      styleList.push(`background-image: url(./${fileName}.png)`)
      domHtml += `<div class="swg swg-${groupList.join('-')} item-${ind} ${isBG ? 'bg' : ''}"></div>\r\n    `
    } else if (query.output === 'img') {
      domHtml += `<img class="swg swg-${groupList.join('-')} item-${ind} ${isBG ? 'bg' : ''}" src="./${fileName}.png" />\r\n    `
    }
  }
  return [styleList, domHtml]
}

module.exports = {
  getOutPut
}