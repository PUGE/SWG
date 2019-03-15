const express    = require('express')
const cors       = require('cors')
const multer  = require('multer')
const {make}  = require('./make')
const app        = express()

var fs = require('fs');
var archiver = require('archiver')

// 当前上传和下载状态
let isPacking = false
let isDownLoading = false

// 只允许上传psd
const fileFilter = (request, file, callback) => {
  if (!file.originalname.match(/\.(psd|PSD)$/)) {
    callback(null, false)
    return
  }
  callback(null, true)
}

const upload = multer({ dest: '../uploads/', fileFilter })

app.use(cors())
app.use(express.static('../public'))



app.post('/uploads', upload.any(), function (request, response, next) {
  if (!request.files || !request.files[0]) {
    response.json({err: 1, message: '没有传递文件!'})
    return
  }
  const file = request.files[0]
  // console.log(file)
  console.log(request.query)
  // 判断是否传递来了模式
  if (!request.query.mode) {
    response.json({err: 1, message: '没有传递参数mode!'})
    return
  }
  // 判断文件是否合规
  if (file) {
    // 判断是否有进程正在执行打包
    if (isPacking) {
      response.json({err: 1, message: '有用户正在执行打包,请稍后再试!'})
    } else {
      isPacking = true
      make(request.query, file.filename)
      isPacking = false
      response.json({err: 0, id: file.filename})
    }
    
  } else {
    response.json({err: 1, message: "不是正确的psd文件!"})
  }
})

app.get('/down', function(request, response, next){
  console.log(request.query)
  // 判断是否有进程正在执行下载
  if (isDownLoading) {
    response.send('{"err":1,"message":"有其他用户正在下载，请稍后再试"}')
  } else {
    isDownLoading = true
    const output = fs.createWriteStream(`../public/temp/${request.query.id}.zip`)
    const archive = archiver('zip')

    archive.on('error', function(err) {
      throw err
    })

    archive.pipe(output);
    archive.directory(`../public/temp/${request.query.id}`, false)
    archive.finalize()
    isDownLoading = false
    response.send('{"err":0}')
  }
})


app.listen(8080, '0.0.0.0', () => {
  console.log('localhost:8080')
})