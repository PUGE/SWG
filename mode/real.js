'use strict'
const { isEmptyLayer, getLayerID, cacheFile, textOutPut }  = require('./tool')

function realOutPut (fileName, node, groupList, outText) {
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
      `width: ${node.width}px`,
      `height: ${node.height}px`,
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
    console.log(element)
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
      const outPut = realOutPut(fileName, element, groupListCopy, outText)
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

    let styleList = [
      'position: absolute',
      `left: ${elementInfo.left - element.parent.left}px`,
      `top: ${elementInfo.top - element.parent.top}px`,
      `right: ${element.parent.right - elementInfo.right}px`,
      `bottom: ${element.parent.bottom - elementInfo.bottom}px`,
      `opacity: ${elementInfo.opacity}`,
      `z-index: ${-ind}`,
      `width: ${elementInfo.width}px`,
      `height: ${elementInfo.height}px`
    ]

    // 判断是否 配置了输出文字 并且此图层是文字
    if (outText && elementInfo.text) {
      [styleList, domHtml] = textOutPut(elementInfo.text, styleList, domHtml, groupListCopy)
    } else {
      // 什么都不是那就输出成图片吧
      styleList.push(`background-image: url(./${fileTemp[layerId]}.png)`)
      domHtml += `<div class="swg swg-${groupListCopy.join('-')} item-${ind}"></div>\r\n    `
    }
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