const express    = require('express')
const cors       = require('cors')
const multer  = require('multer')
const {make}  = require('./make')
const app        = express()

// 只允许上传psd
const fileFilter = (request, file, callback) => {
  if (!file.originalname.match(/\.(psd|PSD)$/)) {
    callback(null, false)
    return
  }
  callback(null, true)
}

const upload = multer({ dest: 'uploads/', fileFilter })

app.use(cors())
app.use(express.static('public'))



app.post('/uploads', upload.any(), function (request, response, next) {
  const file = request.files[0]
  console.log(file)
  // 判断文件是否合规
  if (file) {
    
    make('ratio', file.filename)
    response.json({err: 0, id: file.filename})
  } else {
    response.json({err: 1})
  }
  
})


app.listen(8080, () => {
  console.log('localhost:8080')
})