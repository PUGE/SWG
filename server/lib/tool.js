'use strict'
// 图片处理
const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')

function getRatio (num, total) {
  return parseFloat((num / total * 100).toFixed(2))
}

// 过滤空图层和隐藏图层
function isEmptyLayer (elementInfo) {
  if (elementInfo.visible == false) {
    console.log(`有不可见图层: ${elementInfo.name}`)
    return true
  }
  // 判断是否为空图层
  if (elementInfo.height === 0 || elementInfo.width === 0) {
    console.log(`图层为空: ${elementInfo.name}`)
    return true
  }
}


function getLayerID (layer) {
  return "" + layer.image.obj.numPixels + layer.image.obj.length + layer.image.obj.opacity
}

// 缓存文件
function cacheFile (layerId, element, fileTemp, groupList, fileName, compress) {
  if (fileTemp[layerId] === undefined) {
    fileTemp[layerId] = `${groupList.join('-')}`
    // 导出图片
    if (element.layer.image) {
      const imagePath = `../public/temp/${fileName}/${groupList.join('-')}.png`
      console.log(`保存图片: ${imagePath}`)
      element.layer.image.saveAsPng(imagePath).then((e) => {
        console.log(e)
        // 判断是否开启压缩图片
        if (JSON.parse(compress)) {
          imagemin([imagePath], `../public/temp/${fileName}/`, {
            plugins: [
              imageminPngquant({
                quality: [0.6, 0.8]
              })
            ]
          })
        }
      })
    } else {
      console.log(`没有图层: ${imagePath}`)
    }
  } else {
    console.log(`图层 [${element.name}] 与文件 [${fileTemp[layerId]}] 重复,智能忽略!`)
  }
  return fileTemp
}

function textOutPut (textInfo, styleList, domHtml, groupList) {
  const color = textInfo.font.colors[0]
  console.log('发现文字样式:')
  // console.log(textInfo)
  // 文字的样式
  styleList.push(
    `font-family: '${textInfo.font.name}'`,
    `font-size: ${(textInfo.font.sizes[0] / 24).toFixed(2)}rem`,
    `color: rgba(${color[0]}, ${color[1]}, ${color[2]}, ${(color[3] / 255).toFixed(2)})`
  )
  // 判断是否有文字对齐方式
  if (textInfo.font.alignment[0]) {
    styleList.push(`text-align: ${textInfo.font.alignment[0]}`)
  }
  domHtml += `<div class="swg swg-${groupList.join('-')} text item-${groupList[groupList.length - 1]}">${textInfo.value}</div>\r\n    `
  return [styleList, domHtml]
}

module.exports = {
  getRatio,
  isEmptyLayer,
  getLayerID,
  cacheFile,
  textOutPut
}