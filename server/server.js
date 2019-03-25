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

// 删除文件夹所有内容
function delDir(path) {
  let files = [];
  if(fs.existsSync(path)){
    files = fs.readdirSync(path);
    files.forEach((file, index) => {
      let curPath = path + "/" + file;
      if(fs.statSync(curPath).isDirectory()){
        delDir(curPath); //递归删除文件夹
      } else {
        fs.unlinkSync(curPath); //删除文件
      }
    })
    fs.rmdirSync(path)
  }
}

// 如果目录不存在则创建目录
function creatDirIfNotExist(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }
}

// 自动清理上传目录
function clear () {
  console.log('清理历史文件!')
  delDir('../public/temp')
  delDir('../uploads')
  creatDirIfNotExist('../public/temp')
  creatDirIfNotExist('../uploads')
}
clear()

setInterval(() => {
  console.log('执行定时清理!')
  clear()
}, 1000 * 60 * 60 * 24)

app.post('/uploads', upload.any(), function (request, response, next) {
  if (!request.files || !request.files[0]) {
    response.json({err: 1, message: '没有传递文件!'})
    return
  }
  const file = request.files[0]
  // console.log(file)
  
  // 获取配置项
  const query = {
    mode: request.body.mode,
    output: request.body.output,
    outText: request.body.outText === 'true',
    compress: request.body.compress === 'true',
    adaptation: request.body.adaptation,
    bgm: request.body.bgm === 'true',
    switchMode: request.body.switchMode,
    musicSrc: request.body.musicSrc
  }
  // 判断是否传递来了模式
  if (!query.mode) {
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
      make(query, file.filename)
      isPacking = false
      response.json({err: 0, id: file.filename})
    }
  } else {
    response.json({err: 1, message: "不是正确的psd文件!"})
  }
})

app.get('/down', function(request, response, next){
  console.log('收到下载代码指令!')
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
    output.on('close', function() {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.')
      response.send('{"err":0}')
      isDownLoading = false
    })
    archive.pipe(output);
    archive.directory(`../public/temp/${request.query.id}`, false)
    console.log(`开始打包文件: ../public/temp/${request.query.id}`)
    archive.finalize()
    
  }
})


app.listen(8000, '0.0.0.0', () => {
  console.log('localhost:8080')
})