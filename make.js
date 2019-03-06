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
    if (element.layer.height === 0 || element.layer.width === 0 || element.layer.visible == false) {
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
      `opacity: ${(element.layer.opacity / 255).toFixed(4)}`
    ]
    domHtml += `<div class="swg object-${ind}""></div>\r\n    `
    styleData += `.object-${ind} {${styleList.join('; ')};}\r\n      `
    // 导出图片
    element.layer.image.saveAsPng(`./public/temp/${fileName}/object-${ind}.png`)
  }
  domHtml += `</div>`
  styleData += `\r\n    </style>`
  htmlTemple = htmlTemple.replace(`<!-- page-output -->`, domHtml)
  htmlTemple = htmlTemple.replace(`<!-- css-output -->`, styleData)
  fs.writeFileSync(`./public/temp/${fileName}/index.html`, htmlTemple)
}

function ratioOutPut (fileName, tree, document, htmlTemple) {
  const bodyWidth = document.width
  const bodyHeight = document.height
  let domHtml = `<div class="main-box" style="width: 100%; height: 100%">`
  let styleData = `<style type="text/css">\r\n      `
  for (let ind in tree) {
    
    const element = tree[ind]
    // 跳过空图层
    if (element.layer.height === 0 || element.layer.width === 0 || element.layer.visible == false) {
      continue
    }
    // console.log(element)
    // console.log(element, ind)
    const styleList = [
      'position: absolute',
      `background-image: url(./object-${ind}.png)`,
      `left: ${getRatio(element.left, bodyWidth)}%`,
      `top: ${getRatio(element.top, bodyHeight)}%`,
      `right: ${getRatio(element.right, bodyWidth)}%`,
      `bottom: ${getRatio(element.bottom, bodyHeight)}%`,
      `z-index: ${tree.length - ind}`,
      `opacity: ${(element.layer.opacity / 255).toFixed(4)}`
    ]
    styleList.push(`width: ${getRatio(element.width, bodyWidth)}%`, `height: ${getRatio(element.height, bodyHeight)}%`)
    domHtml += `<div class="swg object-${ind}"></div>\r\n    `
    styleData += `.object-${ind} {${styleList.join('; ')};}\r\n      `

    // 导出图片
    element.layer.image.saveAsPng(`./public/temp/${fileName}/object-${ind}.png`)
  }

  styleData += `\r\n    </style>`
  domHtml += `</div>`
  htmlTemple = htmlTemple.replace(`<!-- page-output -->`, domHtml)
  htmlTemple = htmlTemple.replace(`<!-- css-output -->`, styleData)
  fs.writeFileSync(`./public/temp/${fileName}/index.html`, htmlTemple)
}


function make (mode, fileName) {
  let htmlTemple = temple
  creatDirIfNotExist('./public/temp')
  creatDirIfNotExist(`./public/temp/${fileName}`)
  // 读取图层
  const psd = PSD.fromFile(`./uploads/${fileName}`)
  psd.parse()

  const tree = psd.tree().descendants()
  // 获取画布信息
  const document = psd.tree().export().document
  console.log(`图层个数: ${tree.length}`)
  switch (mode) {
    // 真实输出
    case 'real': {
      
      realOutPut(fileName, tree, document, htmlTemple)
      break
    }
    case 'ratio': {
      ratioOutPut(fileName, tree, document, htmlTemple)
      break
    }
  }
}


module.exports = {
  make
}