'use strict'
const { getOutPut } = require('../lib/output')
const { isEmptyLayer, getLayerID, cacheFile }  = require('../lib/tool')

function realOutPut (fileName, node, groupList, query) {
  const nodeParent = node.parent
  const childrenNodeList = node.children()
  // 文件缓存
  let fileTemp = {}
  const itemIndex = groupList.length > 0 ? parseInt(groupList[groupList.length - 1]) : 0
  // const parent = node

  // 初始化html存储字段
  let domHtml = ''

  // 根节点和子节点通用样式
  let styleList = [
    `z-index: ${-itemIndex}`
  ]

  // 初始化样式临时存储字段
  let styleData = ``
  if (node.isRoot()) {
    styleList.push(
      'position: relative',
      `width: ${node.psd.header.cols}px`,
      `height: ${node.psd.header.rows}px`,
    )
    styleData = `.root {${styleList.join('; ')};}\r\n      `
    domHtml = `<div class="swg root">`
  } else {
    // 如果不是根节点 会有上下左右位置
    styleList.push(
      'position: absolute',
      `left: ${node.left - nodeParent.left}px`,
      `top: ${node.top - nodeParent.top}px`,
      `right: ${nodeParent.right - node.right}px`,
      `bottom: ${nodeParent.bottom - node.bottom}px`,
      `width: ${node.width}px`,
      `height: ${node.height}px`,
    )
    styleData = `.swg-${groupList.join('-')} {${styleList.join('; ')};}\r\n      `
    domHtml = `<div class="swg swg-${groupList.join('-')} item-${itemIndex}">`
  }
  
  for (let ind in childrenNodeList) {
    const element = childrenNodeList[ind]
    const elementInfo = element.export()
    let groupListCopy = JSON.parse(JSON.stringify(groupList))
    groupListCopy.push(ind)
    // console.log(element)
    // if (element.name == '改革1') {
    //   console.log(element.type, element.text)
    //   console.log(element.export())
    // }
    
    // 跳过空图层
    if (isEmptyLayer(elementInfo)) continue

    // 判断是否为组
    if (element.type === 'group') {
      // 递归处理子节点
      // console.log(element.height, element.left)
      console.log(`递归处理组: ${element.name}`)
      const outPut = realOutPut(fileName, element, groupListCopy, query)
      // console.log(outPut)
      domHtml += outPut.html
      styleData += outPut.style
      continue
    }
    // console.log(element.name, elementInfo.left, element.parent.left)
    console.log(`处理图层: ${element.name}`)

    // 从文件缓存中取出是否以前生成过此图层
    const layerId = getLayerID(element.layer)
    fileTemp = cacheFile(layerId, element, fileTemp, groupListCopy, fileName)

    const leftValue = elementInfo.left - element.parent.left
    const topValue = elementInfo.top - element.parent.top
    const rightValue = element.parent.right - elementInfo.right
    const bottomValue = element.parent.bottom - elementInfo.bottom
    let styleList = [
      'position: absolute',
      `left: ${leftValue}px`,
      `top: ${topValue}px`,
      `right: ${rightValue}px`,
      `bottom: ${bottomValue}px`,
      `opacity: ${elementInfo.opacity}`,
      `z-index: ${-ind}`,
      `width: ${elementInfo.width}px`,
      `height: ${elementInfo.height}px`
    ]
    const isBG = leftValue == 0  && topValue == 0 && rightValue == 0 && bottomValue == 0
    const outPutData = getOutPut(elementInfo, styleList, domHtml, groupListCopy, fileTemp[layerId], ind, query, isBG)
    styleList = outPutData[0]
    domHtml = outPutData[1] + '</div>\r\n    '
    styleData += `.swg-${groupListCopy.join('-')} {${styleList.join('; ')};}\r\n      `
  }
  domHtml += `</div>`
  return {
    html: domHtml,
    style: styleData
  }
}

module.exports = {
  realOutPut
}