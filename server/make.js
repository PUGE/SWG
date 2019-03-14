'use strict'
const fs = require('fs')
const PSD = require('psd')

const { ratioOutPut }  = require('./mode/ratio')
const { realOutPut }  = require('./mode/real')
const { phoneOutPut }  = require('./mode/phone')



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

  let domHtml = ``
  let styleData = ``
  switch (query.mode) {
    // 真实输出
    case 'real': {
      styleData += `<style type="text/css">\r\n      `
      const outPut = realOutPut(fileName, psd.tree(), [], query)
      domHtml += outPut.html
      styleData += outPut.style
      break
    }
    case 'ratio': {
      styleData += `<style type="text/css">\r\n      `
      const outPut = ratioOutPut(fileName, psd.tree(), [], query)
      domHtml += outPut.html
      styleData += outPut.style
      break
    }
    case 'phone': {
      styleData += `<style type="text/css">\r\n      `
      const outPut = phoneOutPut(fileName, psd.tree(), [], query)
      domHtml += outPut.html
      styleData += outPut.style
      // 手机页面有自己的js代码
      styleData += `\r\n.bg{ position: fixed;background-size: 100%; }`
      htmlTemple = htmlTemple.replace(`<!-- script-output -->`, `
        <script>
          
          function getSize () {
            var clientWidth = document.body.clientWidth
            var clientHeight = document.body.clientHeight
            var root = document.getElementById('root')
            var rootWidth = root.offsetWidth
            var rootHeight = root.offsetHeight
            console.log(clientWidth / clientHeight)
            console.log(rootWidth / rootHeight)
            console.log(clientWidth / clientHeight - rootWidth / rootHeight)
            var CRW = clientWidth / rootWidth
            var CRH = clientHeight / rootHeight
            console.log(CRW, CRH)
            var min = CRW > CRH ? CRH : CRW
            root.style.width = rootWidth * min + 'px'
            root.style.height = rootHeight * min + 'px'
            root.style.opacity = 1
          }
          window.onload = function() {
            getSize()
          }
          window.onresize = function() {
            getSize()
          }
        </script>
      `)
      break
    }
    case 'phone2': {
      styleData += `<style type="text/css">\r\n      `
      const outPut = phoneOutPut(fileName, psd.tree(), [], query)
      domHtml += outPut.html
      styleData += outPut.style
      // 手机页面有自己的js代码
      htmlTemple = htmlTemple.replace(`<!-- script-output -->`, `
        <script>
          
          function getSize () {
            var clientWidth = document.body.clientWidth
            var clientHeight = document.body.clientHeight
            var root = document.getElementById('root')
            var rootWidth = root.offsetWidth
            var rootHeight = root.offsetHeight
            console.log(clientWidth / clientHeight)
            console.log(rootWidth / rootHeight)
            console.log(clientWidth / clientHeight - rootWidth / rootHeight)
            var CRW = clientWidth / rootWidth
            var CRH = clientHeight / rootHeight
            console.log(CRW, CRH)
            var min = CRW > CRH ? CRH : CRW
            min = min * 0.8
            root.style.width = rootWidth * min + 'px'
            root.style.height = rootHeight * min + 'px'
            root.style.opacity = 1
          }
          window.onload = function() {
            getSize()
          }
          window.onresize = function() {
            getSize()
          }
        </script>
      `)
      break
    }
  }
  styleData += `\r\n    </style>`
  htmlTemple = htmlTemple.replace(`<!-- page-output -->`, domHtml)
  htmlTemple = htmlTemple.replace(`<!-- css-output -->`, styleData)
  fs.writeFileSync(`../public/temp/${fileName}/index.html`, htmlTemple)
}


module.exports = {
  make
}