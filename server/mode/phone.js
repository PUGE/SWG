'use strict'
const { getOutPut } = require('../lib/output')
const { getRatio, isEmptyLayer, getLayerID, cacheFile }  = require('../lib/tool')


function phoneOutPut (fileName, node, groupList, query) {
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
    styleList.push(
      'position: relative',
      `width: ${node.width}px`,
      `height: ${node.height}px`,
    )
    // 因为手机页面需要计算的原因所以用js控制显示
    styleData = `.root {${styleList.join('; ')};position: absolute; left: 0; right: 0; top: 0; bottom: 0; margin: auto;opacity: 0;}\r\n      `
    domHtml = `<div class="swg root" id="root">`
  } else {
    const WC = node.width - node.left - node.right
    const HC = node.height - node.top - node.bottom
    // 是背景吗
    const isBG = WC == 0 && HC == 0
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
    domHtml = `<div class="swg swg-${groupList.join('-')} item-${itemIndex} ${isBG ? 'bg' : ''}">`
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
      const outPut = phoneOutPut(fileName, element, groupListCopy, query)
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
    
    const outPutData = getOutPut(elementInfo, styleList, domHtml, groupListCopy, fileTemp[layerId], ind, node, query)
    styleList = outPutData[0]
    domHtml = outPutData[1]
    styleData += `.swg-${groupListCopy.join('-')} {${styleList.join('; ')};}\r\n      `
    
  }
  domHtml += `</div>`
  return {
    html: domHtml,
    style: styleData
  }
}

module.exports = {
  phoneOutPut
}