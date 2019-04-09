'use strict'
const fs = require('fs')
const PSD = require('psd')

const { ratioOutPut }  = require('./mode/ratio')
const { realOutPut }  = require('./mode/real')
const { phoneOutPut }  = require('./mode/phone')
const { animateOutPut }  = require('./mode/swiper')
const { parallaxOutPut }  = require('./mode/parallax')

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
      #swgRoot {
        opacity: 0;
      }
      .swg-root {
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
      .music-box {
        position: fixed;
        right: 0px;
        top: 0px;
        z-index: 999;
      }
      .music-box .music-play {
        display: none;
        animation-name: circle;
        animation-duration: 5s;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
      }
      .music-box .music-close {
        display: block;
      }
      .music-box img {
        cursor: pointer;
        width: 30px;
        height: 30px;
        padding: 10px;
      }
      @keyframes circle{
        0%{ transform:rotate(0deg); }
        100%{ transform:rotate(360deg); }
      }
    </style>
    <!-- css-output -->
  </head>
  <body>
    <!-- page-output -->
    <!-- music-output -->
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
  creatDirIfNotExist(`../public/temp/${fileName}/img`)
  // 读取图层
  const psd = PSD.fromFile(`../uploads/${fileName}`)
  psd.parse()
  psd.image.saveAsPng('./output.png')

  const treeLength = psd.tree().descendants().length

  console.log(`图层个数: ${treeLength}`)
  console.log(`输出模式:`, query)
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
      if (adaptation === 'real') {
        outPut = realOutPut(fileName, psd.tree(), [], query)
      } else if (adaptation === 'ratio') {
        outPut = ratioOutPut(fileName, psd.tree(), [], query)
      } else if (adaptation === 'levelRatio') {
        outPut = ratioOutPut(fileName, psd.tree(), [], query)
        let fileData = `
          <script>
            window.onload = function() {
              var clientWidth = document.body.clientWidth
              var clientHeight = document.body.clientHeight
              var root = document.getElementById('swgRoot')
              var rootWidth = parseFloat(root.getAttribute('width'))
              var rootHeight = parseFloat(root.getAttribute('height'))
              var WH = rootHeight / rootWidth
              root.style.width = clientWidth + 'px'
              root.style.height = clientWidth * WH + 'px'
              root.style.opacity = 1
            }
          </script>
        `
        htmlTemple = htmlTemple.replace(`<!-- script-output -->`, fileData)
      }
      // 判断
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
      let fileData = fs.readFileSync(`./code/phone/${query.adaptation}.temple`, 'utf8')
      fileData += `
        <script>
          window.onload = function() {
            getSize()
            var root = document.getElementById('swgRoot')
            root.style.opacity = 1
          }
        </script>
      `
      htmlTemple = htmlTemple.replace(`<!-- script-output -->`, fileData)
      break
    }
    // 场景动画-纵向切换
    case 'swiper': {
      styleData += `<style type="text/css">\r\n      `
      const outPut = animateOutPut(fileName, psd.tree(), [], query)
      domHtml += outPut.html + `\r\n    </div>`
      styleData += outPut.style
      // 手机页面有自己的js代码
      styleData += `
          .layer-1 {margin: auto;}
          .swiper-slide {width: 100%; height: 100%; overflow: hidden;position: relative;}
      `
      let fileData = `
        <link rel="stylesheet" href="https://cunchu.site/swg/animate.min.css">
        <script src="https://cunchu.site/swg/swiper.min.js"></script>
        <script src="https://cunchu.site/swg/swiper.animate1.0.3.min.js"></script>
        <script>
          window.onload = function() {
            getSize()
            var root = document.getElementById('swgRoot')
            // 注册swiper
            var mySwiper = new Swiper ('#swgRoot', {
              direction : '${query.switchMode}',
              on:{
                init: function(){
                  swiperAnimateCache(this); //隐藏动画元素 
                  swiperAnimate(this); //初始化完成开始动画
                }, 
                slideChangeTransitionEnd: function(){ 
                  swiperAnimate(this); //每个slide切换结束时也运行当前slide动画
                  //this.slides.eq(this.activeIndex).find('.ani').removeClass('ani'); 动画只展现一次，去除ani类名
                } 
              }
            })
            root.style.opacity = 1
          }
        </script>
      `
      fileData += fs.readFileSync(`./code/phone/${query.adaptation}.temple`, 'utf8')
      htmlTemple = htmlTemple.replace(`<!-- script-output -->`, fileData)
      
      break
    }
    // 视差滚动模式
    case 'parallax': {
      styleData += `<style type="text/css">\r\n      `
      const outPut = parallaxOutPut(fileName, psd.tree(), [], query)
      domHtml += outPut.html
      styleData += outPut.style
      // 手机页面有自己的js代码
      styleData += `\r\n.bg{ position: fixed;background-size: 100%; }`
      let fileData = `
        <script src="https://cdn.jsdelivr.net/npm/lax.js"></script>
        <script>
          window.onload = function() {
            lax.setup() // init

            const updateLax = () => {
              lax.update(window.scrollY)
              window.requestAnimationFrame(updateLax)
            }

            window.requestAnimationFrame(updateLax)
            var root = document.getElementById('swgRoot')
            root.style.opacity = 1
          }
        </script>
      `
      htmlTemple = htmlTemple.replace(`<!-- script-output -->`, fileData)
      break
    }
  }
  styleData += `\r\n    </style>`
  // 判断是否有音乐
  if (query.bgm && query.musicSrc) {
    domHtml += `
      <audio src="${query.musicSrc}" id="bgm" loop>您的浏览器不支持 audio 标签。</audio>
      <div class="music-box">
        <img class="music-play" id="musicPlay" onclick="closeMusic()" src="https://cunchu.site/swg/music-play.png"/>
        <img class="music-close" id="musicClose" onclick="palyMusic()" src="https://cunchu.site/swg/music-close.png"/>
      </div>
    `
    htmlTemple = htmlTemple.replace(`<!-- music-output -->`, `
      <script>
        // 微信自动播放音频
        document.addEventListener('WeixinJSBridgeReady', () => {
          // 播放音乐
          document.getElementById('bgm').play()
          document.getElementById('musicPlay').style.display = 'block'
          document.getElementById('musicClose').style.display = 'none'
        })
        function closeMusic () {
          console.log('关闭音乐播放!')
          document.getElementById('musicPlay').style.display = 'none'
          document.getElementById('musicClose').style.display = 'block'
          document.getElementById('bgm').pause()
        }
        function palyMusic () {
          console.log('开启音乐播放!')
          document.getElementById('musicPlay').style.display = 'block'
          document.getElementById('musicClose').style.display = 'none'
          document.getElementById('bgm').play()
        }
      </script>
    `)
  }
  htmlTemple = htmlTemple.replace(`<!-- page-output -->`, domHtml)
  htmlTemple = htmlTemple.replace(`<!-- css-output -->`, styleData)
  fs.writeFileSync(`../public/temp/${fileName}/index.html`, htmlTemple)
}


module.exports = {
  make
}