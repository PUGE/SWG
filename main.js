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
      div:hover {
        background-color: rgba(0, 0, 0, 0.20);
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

var psd = PSD.fromFile("./1.psd")
psd.parse()


const tree = psd.tree().descendants()

function checkBG (info) {
  if (info.left === 0 && info.top === 0 && info.right === info.width && info.bottom === info.height) {
    return true
  }
  return false
}

const safetyZone = ''
// 测试
// tree.forEach(element => {
//   const info = {
//     file: `${element.name}.png`,
//     left: element.left,
//     right: element.right,
//     top: element.top,
//     bottom: element.bottom,
//     height: element.height,
//     width: element.width
//   }
//   // 判断背景，背景占据整个屏幕
//   console.log(checkBG(info))
  
// })
// return

tree.forEach(element => {
  element.layer.image.saveAsPng(`./output/${element.name}.png`)
})
  
// dom
let domHtml = ``
let index = 0
tree.forEach(element => {
  const info = {
    file: `${element.name}.png`,
    left: element.left,
    right: element.right,
    top: element.top,
    bottom: element.bottom,
    height: element.height,
    width: element.width
  }
  const styleList = [
    'position: absolute',
    `background-image: url(./${element.name}.png)`,
    `width: ${info.width}px`,
    `height: ${info.height}px`,
    `left: ${info.left}px`,
    `top: ${info.top}px`,
    `z-index: ${tree.length - index}`
  ]
  domHtml += `<div class="${element.name}" style="${styleList.join('; ')};"></div>\r\n    `
  index++
})
htmlTemple = htmlTemple.replace(`<!-- page-output -->`, domHtml)
fs.writeFileSync(`./output/index.html`, htmlTemple)
console.log("Finished!")