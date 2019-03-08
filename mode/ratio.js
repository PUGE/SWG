'use strict'
const { getRatio, isEmptyLayer, getLayerID, cacheFile, textOutPut }  = require('./tool')


function ratioOutPut (fileName, node, groupList, outText) {
  // 当前节点的父节点
  const nodeParent = node.parent
  // 当前节点的子节点列表
  const childrenNodeList = node.children()

  // 初始化html存储字段
  let domHtml = ''
  // 初始化样式临时存储字段
  let styleData = ``
  // 文件缓存
  let fileTemp = {}
  // 当前节点ID
  const itemIndex = groupList.length > 0 ? parseInt(groupList[groupList.length - 1]) : 0

  

  // 根节点和子节点通用样式
  let styleList = [`z-index: ${-itemIndex}`] 
  
  // 判断是否为根节点
  if (node.isRoot()) {
    // 根节点样式
    styleList.push('position: relative', 'width: 100%','height: 100%')
    styleData = `.root {${styleList.join('; ')};}\r\n      `
    domHtml = `<div class="swg root">`
  } else {
    // 如果不是根节点 会有上下左右位置
    styleList.push(
      'position: absolute',
      `left: ${getRatio(node.left - nodeParent.left, nodeParent.width)}%`,
      `top: ${getRatio(node.top - nodeParent.top, nodeParent.height)}%`,
      `right: ${getRatio(nodeParent.right - node.right, nodeParent.width)}%`,
      `bottom: ${getRatio(nodeParent.bottom - node.bottom, nodeParent.height)}%`,
      `width: ${getRatio(node.width, nodeParent.width)}%`,
      `height: ${getRatio(node.height, nodeParent.height)}%`,
    )
    styleData = `.swg-${groupList.join('-')} {${styleList.join('; ')};}\r\n      `
    domHtml = `<div class="swg swg-${groupList.join('-')} item-${itemIndex}">`
  }
  
  for (let ind in childrenNodeList) {
    // 获取的子节点
    const element = childrenNodeList[ind]
    // 获取子节点信息
    const elementInfo = element.export()
    let groupListCopy = JSON.parse(JSON.stringify(groupList))
    groupListCopy.push(ind)

    // 跳过空图层
    if (isEmptyLayer(elementInfo)) continue

    // 判断是否为组
    if (element.type === 'group') {
      // 递归处理子节点
      // console.log(element.height, element.left)
      console.log(`递归处理组: ${element.name}`)
      const outPut = ratioOutPut(fileName, element, groupListCopy, outText)
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

    // 生成样式
    let styleList = [
      'position: absolute',
      `left: ${getRatio(elementInfo.left - element.parent.left, element.parent.width)}%`,
      `top: ${getRatio(elementInfo.top - element.parent.top, element.parent.height)}%`,
      `right: ${getRatio(element.parent.right - elementInfo.right, element.parent.width)}%`,
      `bottom: ${getRatio(element.parent.bottom - elementInfo.bottom, element.parent.height)}%`,
      `opacity: ${(elementInfo.opacity).toFixed(2)}`,
      `z-index: ${-ind}`,
      `width: ${getRatio(elementInfo.width, element.parent.width)}%`,
      `height: ${getRatio(elementInfo.height, element.parent.height)}%`
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
  ratioOutPut
}