'use strict'
const fs = require('fs')
var PSD = require('psd');


let temple = `
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <title>Soulless Web Pages</title>
    <!-- *head* -->
    <style type="text/css">
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
      }
      .main-box {
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


function realOutPut (fileName, tree, document, htmlTemple) {
  let domHtml = `<div class="main-box" style="width: ${document.width}px; height: ${document.height}px;">`
  let styleData = `<style type="text/css">\r\n      `
  for (let ind in tree) {
    const element = tree[ind]
    // 跳过空图层
    if (element.height === 0 || element.width === 0 || element.visible == false) {
      continue
    }
    
    const styleList = [
      'position: absolute',
      `background-image: url(./object-${ind}.png)`,
      `width: ${element.width}px`,
      `height: ${element.height}px`,
      `left: ${element.left}px`,
      `top: ${element.top}px`,
      `bottom: ${element.bottom}px`,
      `right: ${element.right}px`,
      `z-index: ${tree.length - ind}`,
      `opacity: ${(element.opacity / 255).toFixed(4)}`
    ]
    domHtml += `<div class="swg object-${ind}""></div>\r\n    `
    styleData += `.object-${ind} {${styleList.join('; ')};}\r\n      `
    // 导出图片
    element.image.saveAsPng(`./public/temp/${fileName}/object-${ind}.png`)
  }
  domHtml += `</div>`
  styleData += `\r\n    </style>`
  htmlTemple = htmlTemple.replace(`<!-- page-output -->`, domHtml)
  htmlTemple = htmlTemple.replace(`<!-- css-output -->`, styleData)
  fs.writeFileSync(`./public/temp/${fileName}/index.html`, htmlTemple)
}

function ratioOutPut (fileName, tree, document, groupList) {
  const chil = tree.children()
  const itemIndex = parseInt(groupList[groupList.length - 1])
  // const parent = tree

  // console.log(tree.left, document.right, bodyWidth, bodyHeight)
  let domHtml = ''
  // 判断是不是根节点
  if (groupList.length === 0) {
    // console.log(tree)
    domHtml = `<div class="swg swg-${groupList.join('-')} root">`
  } else {
    domHtml = `<div class="swg swg-${groupList.join('-')} item-${itemIndex}">`
  }
  // console.log(chil.length, itemIndex)
  // console.log(tree.left, document.left)
  const styleList = [
    'position: absolute',
    `left: ${getRatio(tree.left - document.left, document.width)}%`,
    `top: ${getRatio(tree.top - document.top, document.height)}%`,
    `right: ${getRatio(document.right - tree.right, document.width)}%`,
    `bottom: ${getRatio(document.bottom - tree.bottom, document.height)}%`,
    `width: ${getRatio(tree.width, document.width)}%`,
    `height: ${getRatio(tree.height, document.height)}%`,
    `z-index: ${-itemIndex}`
  ]
  let styleData = `.swg-${groupList.join('-')} {${styleList.join('; ')};}`
  for (let ind in chil) {
    
    const element = chil[ind]
    let groupListCopy = JSON.parse(JSON.stringify(groupList))
    groupListCopy.push(ind)
    // console.log(element.name)
    // if (element.name == '场景1-黑白云') {
    //   console.log(element.type, ind)
    //   console.log(element)
    // }
    
    // 跳过空图层
    if (element.layer.visible == false) {
      console.log(`有不可见图层: ${element.name}`)
      continue
    }
    // 判断是否为组
    if (element.type === 'group') {
      // 递归处理子节点
      // console.log(element.height, element.left)
      console.log(`递归处理组: ${element.name}`)
      const outPut = ratioOutPut(fileName, element, element.parent, groupListCopy)
      // console.log(outPut)
      domHtml += outPut.html
      styleData += outPut.style
    } else {
      if (element.layer.height === 0 || element.layer.width === 0) {
        console.log(`图层为空: ${element.name}`)
        continue
      }
      console.log(element.name, element.layer.left, element.parent.left)
      console.log(`处理图层: ${element.name}`)
      const styleList = [
        'position: absolute',
        `background-image: url(./${groupListCopy.join('-')}.png)`,
        `left: ${getRatio(element.layer.left - element.parent.left, element.parent.width)}%`,
        `top: ${getRatio(element.layer.top - element.parent.top, element.parent.height)}%`,
        `right: ${getRatio(element.parent.right - element.layer.right, element.parent.width)}%`,
        `bottom: ${getRatio(element.parent.bottom - element.layer.bottom, element.parent.height)}%`,
        `opacity: ${(element.layer.opacity / 255).toFixed(4)}`,
        `z-index: ${-ind}`
      ]
      styleList.push(`width: ${getRatio(element.layer.width, element.parent.width)}%`, `height: ${getRatio(element.layer.height, element.parent.height)}%`)
      domHtml += `<div class="swg swg-${groupListCopy.join('-')} item-${ind}"></div>\r\n    `
      styleData += `.swg-${groupListCopy.join('-')} {${styleList.join('; ')};}\r\n      `
  
      // 导出图片
      // console.log(element.layer.image)
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

  let domHtml = ``
  let styleData = ``
  switch (mode) {
    // 真实输出
    case 'real': {
      realOutPut(fileName, psd.tree().children(), document, htmlTemple)
      break
    }
    case 'ratio': {
      domHtml += `<div class="main-box" style="width: 100%; height: 100%">`
      styleData += `<style type="text/css">\r\n      `
      const outPut = ratioOutPut(fileName, psd.tree(), document, [])
      domHtml += outPut.html
      styleData += outPut.style
      break
    }
  }
  styleData += `\r\n    </style>`
  domHtml += `</div>`
  htmlTemple = htmlTemple.replace(`<!-- page-output -->`, domHtml)
  htmlTemple = htmlTemple.replace(`<!-- css-output -->`, styleData)
  fs.writeFileSync(`./public/temp/${fileName}/index.html`, htmlTemple)
}


module.exports = {
  make
}