'use strict'
const { getOutPut } = require('../lib/output')
const { getRatio, isEmptyLayer, getLayerID, cacheFile }  = require('../lib/tool')


function parallaxOutPut (fileName, node, groupList, query) {
  // 当前节点的父节点
  const nodeParent = node.parent
  // 根节点
  const nodeRoot = node.root()
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
    styleData = `.swg-root {${styleList.join('; ')}; margin: auto;}\r\n      `
    domHtml = `<div class="swg swg-root" id="swgRoot" width="${node.width}" height="${node.height}">`
  } else {
    // 从文件缓存中取出是否以前生成过此图层
    const layerId = getLayerID(node.layer)
    fileTemp = cacheFile(layerId, node, fileTemp, groupList, fileName, query.compress)
    // 如果不是根节点 会有上下左右位置
    const leftValue = getRatio(node.left - nodeParent.left, nodeParent.width)
    const topValue = getRatio(node.top - nodeParent.top, nodeParent.height)
    const rightValue = getRatio(nodeParent.right - node.right, nodeParent.width)
    const bottomValue = getRatio(nodeParent.bottom - node.bottom, nodeParent.height)
    styleList.push(
      'position: absolute',
      `left: ${leftValue}%`,
      `top: ${topValue}%`,
      `right: ${rightValue}%`,
      `bottom: ${bottomValue}%`,
      `width: ${getRatio(node.width, nodeParent.width)}%`,
      `height: ${getRatio(node.height, nodeParent.height)}%`,
    )
    const isBG = leftValue == 0  && topValue == 0 && rightValue == 0 && bottomValue == 0 && elementInfo.width == nodeRoot.width && elementInfo.height == nodeRoot.height
    const outPutData = getOutPut(node.export(), styleList, domHtml, groupList, fileTemp[layerId], itemIndex, query, isBG)
    styleList = outPutData[0]
    domHtml = outPutData[1] + '\r\n    '
    // console.log(`.swg-${groupList.join('-')} {${styleList.join('; ')};}\r\n      `)
    styleData = `.swg-${groupList.join('-')} {${styleList.join('; ')};}\r\n      `
  }
  
  for (let ind in childrenNodeList) {
    // 获取的子节点
    const node = childrenNodeList[ind]
    const nodeParent = node.parent
    // 获取子节点信息
    const elementInfo = node.export()
    let groupListCopy = JSON.parse(JSON.stringify(groupList))
    groupListCopy.push(ind)

    // 跳过空图层
    if (isEmptyLayer(elementInfo)) continue

    // 判断是否为组
    if (node.type === 'group') {
      // 递归处理子节点
      // console.log(node.height, node.left)
      console.log(`递归处理组: ${node.name}`)
      const outPut = parallaxOutPut(fileName, node, groupListCopy, query)
      // console.log(outPut)
      domHtml += outPut.html
      styleData += outPut.style
      continue
    }
    

    // console.log(node.name, elementInfo.left, node.parent.left)
    console.log(`处理图层: ${node.name}`)

    // 从文件缓存中取出是否以前生成过此图层
    const layerId = getLayerID(node.layer)
    fileTemp = cacheFile(layerId, node, fileTemp, groupListCopy, fileName, query.compress)
    // 生成样式
    // 如果不是根节点 会有上下左右位置
    const leftValue = getRatio(elementInfo.left - nodeParent.left, nodeParent.width)
    const topValue = getRatio(elementInfo.top - nodeParent.top, nodeParent.height)
    const rightValue = getRatio(nodeParent.right - elementInfo.right, nodeParent.width)
    const bottomValue = getRatio(nodeParent.bottom - elementInfo.bottom, nodeParent.height)
    let styleList = [
      'position: absolute',
      `left: ${leftValue}%`,
      `top: ${topValue}%`,
      `right: ${rightValue}%`,
      `bottom: ${bottomValue}%`,
      `opacity: ${(elementInfo.opacity).toFixed(2)}`,
      `z-index: ${-ind}`,
      `width: ${getRatio(elementInfo.width, node.parent.width)}%`,
      `height: ${getRatio(elementInfo.height, node.parent.height)}%`
    ]
    const isBG = leftValue == 0  && topValue == 0 && rightValue == 0 && bottomValue == 0 && elementInfo.width == nodeRoot.width && elementInfo.height == nodeRoot.height
    const outPutData = getOutPut(elementInfo, styleList, domHtml, groupListCopy, fileTemp[layerId], ind, query, isBG)
    styleList = outPutData[0]
    // 如果是背景模式则需要封闭标签
    if (query.output === 'background') {
      domHtml = outPutData[1] + '</div>\r\n    '
    } else {
      domHtml = outPutData[1]
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
  parallaxOutPut
}