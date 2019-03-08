'use strict'
const fs = require('fs')
var PSD = require('psd')



let temple = `
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <title>Soulless Web Pages</title>
    <meta charset="UTF-8">
    <!-- *head* -->
    <style type="text/css">
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        font-size: 24px;
      }
      .root {
        overflow: hidden;
        position: relative;
      }
      .swg:hover {
        background-color: rgba(0, 0, 0, 0.20);
      }
      .swg {
        background-repeat: no-repeat;
        background-size: 100% 100%;
      }
    </style>
    <!-- css-output -->
  </head>
  <body>
    <!-- page-output -->
    <!-- script-output -->
  </body>
</html>
`

// 如果目录不存在则创建目录
function creatDirIfNotExist (path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }
}

function getRatio (num, total) {
  return (num / total * 100).toFixed(2)
}


function realOutPut (fileName, node, groupList, outText) {
  const nodeParent = node.parent
  const isRoot = node.isRoot()
  const chil = node.children()
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
  
  if (isRoot) {
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
  
  for (let ind in chil) {
    const element = chil[ind]
    const elementInfo = element.export()
    let groupListCopy = JSON.parse(JSON.stringify(groupList))
    groupListCopy.push(ind)
    // console.log(element.name)
    // if (element.name == '改革1') {
    //   console.log(element.type, element.text)
    //   console.log(element.export())
    // }
    
    // 跳过空图层
    if (elementInfo.visible == false) {
      console.log(`有不可见图层: ${element.name}`)
      continue
    }
    // 判断是否为组
    if (element.type === 'group') {
      // 递归处理子节点
      // console.log(element.height, element.left)
      console.log(`递归处理组: ${element.name}`)
      const outPut = realOutPut(fileName, element, groupListCopy)
      // console.log(outPut)
      domHtml += outPut.html
      styleData += outPut.style
    } else {
      if (elementInfo.height === 0 || elementInfo.width === 0) {
        console.log(`图层为空: ${element.name}`)
        continue
      }
      // console.log(element.name, elementInfo.left, element.parent.left)
      console.log(`处理图层: ${element.name}`)
      let styleList = [
        'position: absolute',
        `left: ${elementInfo.left - element.parent.left}px`,
        `top: ${elementInfo.top - element.parent.top}px`,
        `right: ${element.parent.right - elementInfo.right}px`,
        `bottom: ${element.parent.bottom - elementInfo.bottom}px`,
        `opacity: ${elementInfo.opacity}`,
        `z-index: ${-ind}`
      ]
      styleList.push(`width: ${elementInfo.width}px`, `height: ${elementInfo.height}px`)
      // 判断是否 配置了输出文字 并且此图层是文字
      if (outText && elementInfo.text) {
        const color = elementInfo.text.font.colors[0]
        console.log('发现文字样式:')
        // console.log(elementInfo.text)
        // 文字的样式
        styleList.push(
          `font-family: '${elementInfo.text.font.name}'`,
          `font-size: ${(elementInfo.text.font.sizes[0] / 24).toFixed(2)}rem`,
          `color: rgba(${color[0]}, ${color[1]}, ${color[2]}, ${(color[3] / 255).toFixed(2)})`
        )
        // 判断是否有文字对齐方式
        if (elementInfo.text.font.alignment[0]) {
          styleList.push(`text-align: ${elementInfo.text.font.alignment[0]}`)
        }
        domHtml += `<div class="swg swg-${groupListCopy.join('-')} text item-${ind}">${elementInfo.text.value}</div>\r\n    `
      } else {
        // 什么都不是那就输出成图片吧
        styleList.push(`background-image: url(./${groupListCopy.join('-')}.png)`)
        domHtml += `<div class="swg swg-${groupListCopy.join('-')} item-${ind}"></div>\r\n    `
      }
      styleData += `.swg-${groupListCopy.join('-')} {${styleList.join('; ')};}\r\n      `
  
      // 导出图片
      // console.log(elementInfo.image)
      if (element.layer.image) {
        element.layer.image.saveAsPng(`./public/temp/${fileName}/${groupListCopy.join('-')}.png`)
      }
    }
  }
  domHtml += `</div>`
  return {
    html: domHtml,
    style: styleData
  }
}

function ratioOutPut (fileName, node, groupList, outText) {
  // 当前节点的父节点
  const nodeParent = node.parent
  // 当前节点的子节点列表
  const chil = node.children()

  // 初始化html存储字段
  let domHtml = ''
  // 初始化样式临时存储字段
  let styleData = ``
  // 文件缓存
  const fileTemp = {}
  // 当前节点ID
  const itemIndex = groupList.length > 0 ? parseInt(groupList[groupList.length - 1]) : 0

  

  // 根节点和子节点通用样式
  let styleList = [
    `z-index: ${-itemIndex}`
  ]

  
  
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
  
  for (let ind in chil) {
    const element = chil[ind]
    const elementInfo = element.export()
    let groupListCopy = JSON.parse(JSON.stringify(groupList))
    groupListCopy.push(ind)

    
    // 跳过空图层
    if (elementInfo.visible == false) {
      console.log(`有不可见图层: ${element.name}`)
      continue
    }
    // 判断是否为组
    if (element.type === 'group') {
      // 递归处理子节点
      // console.log(element.height, element.left)
      console.log(`递归处理组: ${element.name}`)
      const outPut = ratioOutPut(fileName, element, groupListCopy)
      // console.log(outPut)
      domHtml += outPut.html
      styleData += outPut.style
    } else {

      if (elementInfo.height === 0 || elementInfo.width === 0) {
        console.log(`图层为空: ${element.name}`)
        continue
      }


      // console.log(element.name, elementInfo.left, element.parent.left)
      console.log(`处理图层: ${element.name}`)

      // 从文件缓存中取出是否以前生成过此图层
      const layerId = "" + element.layer.image.obj.numPixels + element.layer.image.obj.length + element.layer.image.obj.opacity
      if (fileTemp[layerId] === undefined) {
        fileTemp[layerId] = `${groupListCopy.join('-')}`
        // 导出图片
        if (element.layer.image) {
          const imagePath = `./public/temp/${fileName}/${groupListCopy.join('-')}.png`
          element.layer.image.saveAsPng(imagePath)
          console.log(`保存图片: ${imagePath}`)
        }
      } else {
        console.log(`图层 [${element.name}] 与文件 [${fileTemp[layerId]}] 重复,智能忽略!`)
      }

      let styleList = [
        'position: absolute',
        `left: ${getRatio(elementInfo.left - element.parent.left, element.parent.width)}%`,
        `top: ${getRatio(elementInfo.top - element.parent.top, element.parent.height)}%`,
        `right: ${getRatio(element.parent.right - elementInfo.right, element.parent.width)}%`,
        `bottom: ${getRatio(element.parent.bottom - elementInfo.bottom, element.parent.height)}%`,
        `opacity: ${elementInfo.opacity}`,
        `z-index: ${-ind}`
      ]
      styleList.push(`width: ${getRatio(elementInfo.width, element.parent.width)}%`, `height: ${getRatio(elementInfo.height, element.parent.height)}%`)
      // 判断是否 配置了输出文字 并且此图层是文字
      if (outText && elementInfo.text) {
        const color = elementInfo.text.font.colors[0]
        console.log('发现文字样式:')
        // console.log(elementInfo.text)
        // 文字的样式
        styleList.push(
          `font-family: '${elementInfo.text.font.name}'`,
          `font-size: ${(elementInfo.text.font.sizes[0] / 24).toFixed(2)}rem`,
          `color: rgba(${color[0]}, ${color[1]}, ${color[2]}, ${(color[3] / 255).toFixed(2)})`
        )
        // 判断是否有文字对齐方式
        if (elementInfo.text.font.alignment[0]) {
          styleList.push(`text-align: ${elementInfo.text.font.alignment[0]}`)
        }
        domHtml += `<div class="swg swg-${groupListCopy.join('-')} text item-${ind}">${elementInfo.text.value}</div>\r\n    `
      } else {
        // 什么都不是那就输出成图片吧
        styleList.push(`background-image: url(./${fileTemp[layerId]}.png)`)
        domHtml += `<div class="swg swg-${groupListCopy.join('-')} item-${ind}"></div>\r\n    `
      }
      styleData += `.swg-${groupListCopy.join('-')} {${styleList.join('; ')};}\r\n      `
  
      
    }
  }
  domHtml += `</div>`
  return {
    html: domHtml,
    style: styleData
  }
}


function make (query, fileName) {
  let htmlTemple = temple
  creatDirIfNotExist('./public/temp')
  creatDirIfNotExist(`./public/temp/${fileName}`)
  // 读取图层
  const psd = PSD.fromFile(`./uploads/${fileName}`)
  psd.parse()

  const treeLength = psd.tree().descendants().length

  console.log(`图层个数: ${treeLength}`)
  console.log(`输出模式: ${query.mode}`)

  let domHtml = ``
  let styleData = ``
  switch (query.mode) {
    // 真实输出
    case 'real': {
      styleData += `<style type="text/css">\r\n      `
      const outPut = realOutPut(fileName, psd.tree(), [], JSON.parse(query.outText))
      domHtml += outPut.html
      styleData += outPut.style
      break
    }
    case 'ratio': {
      styleData += `<style type="text/css">\r\n      `
      const outPut = ratioOutPut(fileName, psd.tree(), [], JSON.parse(query.outText))
      domHtml += outPut.html
      styleData += outPut.style
      break
    }
  }
  styleData += `\r\n    </style>`
  htmlTemple = htmlTemple.replace(`<!-- page-output -->`, domHtml)
  htmlTemple = htmlTemple.replace(`<!-- css-output -->`, styleData)
  fs.writeFileSync(`./public/temp/${fileName}/index.html`, htmlTemple)
}


module.exports = {
  make
}