const { execSync } = require('child_process')

const runshell = (command, cwd) => {
  execSync(command, { stdio: 'inherit', cwd })
}

const qiniu = require('qiniu')
const version = require('../package.json').version
const accessKey = process.argv[2]
const secretKey = process.argv[3]

// js 上传空间
const jsBucket = 'cdn-ronghub-com'
// prod.zip 文件上传空间
const prodZipBucket = 'rongcloud-sdk'

const uploadToQiniu = (fileName, fileRelativePath) => {
  return new Promise((resolve, reject) => {
    let bucket = /\.prod\.js\.zip$/.test(fileName) ? prodZipBucket : jsBucket
    if (/\.latest\.js$/.test(fileName)) {
      bucket = bucket + ':' + fileName
    }

    const config = new qiniu.conf.Config()
    const formUploader = new qiniu.form_up.FormUploader(config)
    const putExtra = new qiniu.form_up.PutExtra()

    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: bucket,
      expires: 3600
    })
    const uploadToken = putPolicy.uploadToken(mac)

    console.log('开始上传：' + fileName)

    // 文件上传
    formUploader.putFile(uploadToken, fileName, fileRelativePath, putExtra, (respErr, respBody, respInfo) => {
      if (respErr) {
        reject(respErr)
        throw respErr
      }
      if (respInfo.statusCode === 200) {
        console.log('上传成功！！！=> fileName:' + respBody.key + ', hash: ' + respBody.hash)
        resolve(respBody)
      } else {
        console.error('上传失败 => ', {
          fileName,
          message: respBody,
          code: respInfo.statusCode
        })
        const errorStr = JSON.stringify({
          code: respInfo.statusCode,
          message: respBody
        })

        reject(new Error(errorStr))
      }
    })
  })
}

// prod.js 生成 zip 包（产品要求）
const prodFileName = `RCRTCAdapter-${version}.prod.js`
const prodPath = `./release/cdn/${prodFileName}`
runshell(`zip -q ${prodPath}.zip ${prodPath}`)

// 要上传的文件名
const fileList = [
  `${prodFileName}`,
  `${prodFileName}.zip`,
  `RCRTCAdapter-${version.replace(/\.\d$/g, '')}.latest.js`
]

const main = async () => {
  try {
    for (let i = 0; i < fileList.length; i++) {
      const fileName = fileList[i]
      const fileRelativePath = `./release/cdn/${fileName}`
      await uploadToQiniu(fileName, fileRelativePath)
    }
  } catch (error) {
    console.error(error)
  }
}

main()
