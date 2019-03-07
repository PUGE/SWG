'use strict'
const fs = require('fs')
var PSD = require('psd');


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
// 运行模式
// const mode = 'real'
// const mode = 'ratio'

function checkBG (info) {
  if (info.left === 0 && info.top === 0 && info.right === info.width && info.bottom === info.height) {
    return true
  }
  return false
}

// 如果目录不存在则创建目录
function creatDirIfNotExist (path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }
}

function getRatio (num, total) {
  return (num / total * 100).toFixed(2)
}


function realOutPut (fileName, tree, groupList) {
  const document = tree.parent
  const isRoot = tree.isRoot()
  const chil = tree.children()
  const itemIndex = groupList.length > 0 ? parseInt(groupList[groupList.length - 1]) : 0
  // const parent = tree

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
      `width: ${tree.width}px`,
      `height: ${tree.height}px`,
    )
    styleData = `.root {${styleList.join('; ')};}\r\n      `
    domHtml = `<div class="swg root">`
  } else {
    // 如果不是根节点 会有上下左右位置
    styleList.push(
      'position: absolute',
      `left: ${tree.left - document.left}px`,
      `top: ${tree.top - document.top}px`,
      `right: ${document.right - tree.right}px`,
      `bottom: ${document.bottom - tree.bottom}px`,
      `width: ${tree.width}px`,
      `height: ${tree.height}px`,
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
      // 判断是否是文字
      if (elementInfo.text) {
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

function ratioOutPut (fileName, tree, groupList) {
  const document = tree.parent
  const isRoot = tree.isRoot()
  const chil = tree.children()
  const itemIndex = groupList.length > 0 ? parseInt(groupList[groupList.length - 1]) : 0
  // const parent = tree

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
      'width: 100%',
      'height: 100%',
    )
    styleData = `.root {${styleList.join('; ')};}\r\n      `
    domHtml = `<div class="swg root">`
  } else {
    // 如果不是根节点 会有上下左右位置
    styleList.push(
      'position: absolute',
      `left: ${getRatio(tree.left - document.left, document.width)}%`,
      `top: ${getRatio(tree.top - document.top, document.height)}%`,
      `right: ${getRatio(document.right - tree.right, document.width)}%`,
      `bottom: ${getRatio(document.bottom - tree.bottom, document.height)}%`,
      `width: ${getRatio(tree.width, document.width)}%`,
      `height: ${getRatio(tree.height, document.height)}%`,
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
      // 判断是否是文字
      if (elementInfo.text) {
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


function make (mode, fileName) {
  let htmlTemple = temple
  creatDirIfNotExist('./public/temp')
  creatDirIfNotExist(`./public/temp/${fileName}`)
  // 读取图层
  const psd = PSD.fromFile(`./uploads/${fileName}`)
  psd.parse()

  const treeLength = psd.tree().descendants().length
  // 获取画布信息
  // console.log(psd.tree().children()[0])
  const document = psd.tree().export().document
  console.log(`图层个数: ${treeLength}`)
  console.log(`输出模式: ${mode}`)

  let domHtml = ``
  let styleData = ``
  switch (mode) {
    // 真实输出
    case 'real': {
      styleData += `<style type="text/css">\r\n      `
      const outPut = realOutPut(fileName, psd.tree(), [])
      domHtml += outPut.html
      styleData += outPut.style
      break
    }
    case 'ratio': {
      styleData += `<style type="text/css">\r\n      `
      const outPut = ratioOutPut(fileName, psd.tree(), [])
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