'use strict'
const fs = require('fs')
const PSD = require('psd')

const { ratioOutPut }  = require('./mode/ratio')
const { realOutPut }  = require('./mode/real')
const { phoneOutPut }  = require('./mode/phone')
const { animateOutPut }  = require('./mode/animate')



let temple = `
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <title>Soulless Web Pages</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="height=device-height,initial-scale=1,user-scalable=no,maximum-scale=1,,user-scalable=no"/>
    <meta name="renderer" content="webkit"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>
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


function make (query, fileName) {
  let htmlTemple = temple
  creatDirIfNotExist('../public/temp')
  creatDirIfNotExist(`../public/temp/${fileName}`)
  // 读取图层
  const psd = PSD.fromFile(`../uploads/${fileName}`)
  psd.parse()

  const treeLength = psd.tree().descendants().length

  console.log(`图层个数: ${treeLength}`)
  console.log(`输出模式: ${query.mode}`)
  console.log(`图像宽度: ${psd.header.cols}, 图像高度: ${psd.header.rows}`)
  let domHtml = ``
  let styleData = ``
  switch (query.mode) {
    // 通用模式
    case 'currency': {
      let outPut = null
      styleData += `<style type="text/css">\r\n      `
      // 判断适配方案
      const adaptation = query.adaptation
      if (query.adaptation === 'real') {
        outPut = realOutPut(fileName, psd.tree(), [], query)
      } else if (adaptation) {
        outPut = ratioOutPut(fileName, psd.tree(), [], query)
      }
      domHtml += outPut.html
      styleData += outPut.style
      break
    }
    // 手机模式
    case 'phone': {
      styleData += `<style type="text/css">\r\n      `
      const outPut = phoneOutPut(fileName, psd.tree(), [], query)
      domHtml += outPut.html
      styleData += outPut.style
      // 手机页面有自己的js代码
      styleData += `\r\n.bg{ position: fixed;background-size: 100%; }`
      const fileData = fs.readFileSync(`./code/phone/${query.adaptation}.temple`, 'utf8')
      htmlTemple = htmlTemple.replace(`<!-- script-output -->`, fileData)
      break
    }
    // 场景动画-纵向切换
    case 'animate': {
      styleData += `<style type="text/css">\r\n      `
      const outPut = animateOutPut(fileName, psd.tree(), [], query)
      domHtml += outPut.html + `\r\n    </div>`
      styleData += outPut.style
      // 手机页面有自己的js代码
      styleData += `
          .swiper-slide {width: 100%; overflow: hidden;position: relative;}
      `
      const fileData = fs.readFileSync('./code/phone/portrait.temple', 'utf8')
      htmlTemple = htmlTemple.replace(`<!-- script-output -->`, fileData)
      break
    }
  }
  styleData += `\r\n    </style>
      <link rel="stylesheet" href="https://puge-10017157.cos.ap-shanghai.myqcloud.com/swg/animate.min.css">
  `
  htmlTemple = htmlTemple.replace(`<!-- page-output -->`, domHtml)
  htmlTemple = htmlTemple.replace(`<!-- css-output -->`, styleData)
  fs.writeFileSync(`../public/temp/${fileName}/index.html`, htmlTemple)
}


module.exports = {
  make
}