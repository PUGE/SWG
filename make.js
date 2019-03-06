'use strict'
const fs = require('fs')
var PSD = require('psd');


let htmlTemple = `
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


function realOutPut (fileName, tree) {
  let domHtml = ``
  for (let ind in tree) {
    const element = tree[ind]
    // 跳过空图层
    if (element.layer.height === 0 || element.layer.width === 0) {
      continue
    }
    
    const styleList = [
      'position: absolute',
      `background-image: url(./object-${ind}.png)`,
      `width: ${element.width}px`,
      `height: ${element.height}px`,
      `left: ${element.left}px`,
      `top: ${element.top}px`,
      `z-index: ${tree.length - ind}`
    ]
    domHtml += `<div class="swg object-${ind}" style="${styleList.join('; ')};"></div>\r\n    `
    // 导出图片
    element.layer.image.saveAsPng(`./public/temp/${fileName}/object-${ind}.png`)
  }
  htmlTemple = htmlTemple.replace(`<!-- page-output -->`, domHtml)
  fs.writeFileSync(`./public/temp/${fileName}/index.html`, htmlTemple)
}

function ratioOutPut (fileName, tree) {
  const bodyWidth = psd.header.cols
  const bodyHeight = psd.header.rows
  let domHtml = ``
  let styleData = `<style type="text/css">\r\n      `
  for (let ind in tree) {
    
    const element = tree[ind]
    // 跳过空图层
    if (element.layer.height === 0 || element.layer.width === 0) {
      continue
    }

    const styleList = [
      'position: absolute',
      `background-image: url(./object-${ind}.png)`,
      `left: ${getRatio(element.left, bodyWidth)}%`,
      `top: ${getRatio(element.top, bodyHeight)}%`,
      `z-index: ${tree.length - ind}`
    ]
    styleList.push(`width: ${getRatio(element.width, bodyWidth)}%`, `height: ${getRatio(element.height, bodyHeight)}%`)
    domHtml += `<div class="swg object-${ind}"></div>\r\n    `
    styleData += `.object-${ind} {${styleList.join('; ')};}\r\n      `

    // 导出图片
    element.layer.image.saveAsPng(`./public/temp/${fileName}/object-${ind}.png`)
  }

  styleData += `\r\n    </style>`

  htmlTemple = htmlTemple.replace(`<!-- page-output -->`, domHtml)
  htmlTemple = htmlTemple.replace(`<!-- css-output -->`, styleData)
  fs.writeFileSync(`./public/temp/${fileName}/index.html`, htmlTemple)
}


function make (mode, fileName) {
  creatDirIfNotExist('./public/temp')
  creatDirIfNotExist(`./public/temp/${fileName}`)
  // 读取图层
  const psd = PSD.fromFile(`./uploads/${fileName}`)
  psd.parse()

  const tree = psd.tree().descendants()
  switch (mode) {
    // 真实输出
    case 'real': {
      realOutPut(fileName, tree)
      break
    }
    case 'ratio': {
      ratioOutPut(fileName, tree)
      break
    }
  }
}


module.exports = {
  make
}