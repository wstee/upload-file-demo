const fse = require('fs-extra');
const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const serve = require('koa-static');
const cors = require('@koa/cors');
const multer = require('@koa/multer');
const Router = require('@koa/router');
const { bodyParser } = require('@koa/bodyparser');

const app = new Koa();
const router = new Router();
const UPLOAD_DIR = path.join(__dirname, '/uploads');
const FILE_URL = 'http://localhost:3000/';
app.use(bodyParser());

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    // 文件夹上传时处理文件路径，自动创建文件夹
    // multer处理文件名时，文件名不能有/，所以上传时斜线替换为@或其他字符
    const relativePath = file.originalname.replace(/@/g, path.sep);
    const lastIdx = relativePath.lastIndexOf(path.sep);
    let dir = path.join(UPLOAD_DIR, relativePath.substring(0, lastIdx));
    await fse.ensureDir(dir)
    // 大文件上传分片
    if(req.body.md5) {
      dir = path.join(UPLOAD_DIR, `chunk-${req.body?.md5}`);
      await fse.ensureDir(dir)
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // 解决中文名乱码的问题
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    const filename = req.body?.md5 ? `chunk-${req.body?.md5}-${req.body?.index}` : Date.now() + '-' + file.originalname.replace(/.*@/g,'');
    cb(null, filename);
  }
})

const upload = multer({ storage: storage });

router.get('/', async (ctx) => {
  ctx.body = 'Hello World!'
});

// 单文件上传
router.post('/upload/single', upload.single('file'), async (ctx, next) => {
  try {
    await next();
    ctx.body = {
      code: 0,
      msg: '上传成功',
      data: FILE_URL + ctx.file.filename,
    };
  } catch (error) {
    console.log(error)
    ctx.body = {
      code: 1,
      msg: '上传失败'
    };
  }
});

// 多文件上传
router.post('/upload/multiple', upload.fields([{ name: 'file' }]), async (ctx, next) => {
  try {
    await next();
    const files = ctx.files.file.map(file => {
      return FILE_URL + file.filename;
    })
    ctx.body = {
      code: 0,
      msg: '上传成功',
      data: files
    };
  } catch (error) {
    console.log(error)
    ctx.body = {
      code: 1,
      msg: '上传失败'
    };
  }
})
router.post('/fileExist', async (ctx, next) => {
  await next()
  const { filename, md5 } = ctx.request.body;
  console.log(filename, md5)
})
// 大文件上传
router.post('/upload/big', upload.single('file'), async (ctx, next) => {
  try {
    await next();
    ctx.body = {
      code: 0,
      msg: '上传成功'
    };
  } catch (error) {
    console.log(error)
    ctx.body = {
      code: 1,
      msg: '上传失败'
    };
  }
});
/**
 * 文件合并
 * @param {string} sourceFilesDir 源文件目录
 * @param {string} targetFile 目标文件路径
 */
function chunkFileMerge(sourceFilesDir, targetFile) {

  // 将文件列表按照index倒序排序
  const fileList = fs
    .readdirSync(sourceFilesDir)
    .filter((file) => fs.lstatSync(path.join(sourceFilesDir, file)).isFile())
    .sort((a, b) => parseInt(b.split('-')[2]) - parseInt(a.split('-')[2]))
    .map((name) => ({
      name,
      filePath: path.join(sourceFilesDir, name),
    }));
  // 创建写入流，将切片文件导入这个流，完成合并
  const fileWriteStream = fs.createWriteStream(targetFile);
  chunkStreamMerge(fileList, fileWriteStream, sourceFilesDir);
}

/**
 * 合并切片
 * @param {Array} fileList 文件数据列表
 * @param {WritableStream} fileWriteStream 最终的写入结果流
 * @param {string} sourceFilesDir 源文件目录
 */
function chunkStreamMerge(fileList, fileWriteStream, sourceFilesDir) {
  if (!fileList.length) {
    fileWriteStream.end('完成了');
    // 删除临时目录
    fse.remove(sourceFilesDir)
    return;
  }

  const { filePath: chunkFilePath } = fileList.pop();
  const currentReadStream = fs.createReadStream(chunkFilePath);

  // 把结果往最终的生成文件上进行拼接
  currentReadStream.pipe(fileWriteStream, { end: false });

  currentReadStream.on('end', () => {
    // 拼接完之后进入下一次循环
    chunkStreamMerge(fileList, fileWriteStream, sourceFilesDir);
  });
}
router.post('/upload/merge', async (ctx, next) => {
  try {
    await next();
    const { md5, filename } = ctx.request.body;
    console.log(md5, filename)
    chunkFileMerge(path.join(UPLOAD_DIR, 'chunk-' + md5), path.join(UPLOAD_DIR, md5 +'-'+filename));

    ctx.body = {
      code: 0,
      msg: '上传成功',
      data: FILE_URL +  md5 +'-'+filename
    };
  } catch (error) {
    console.log(error)
    ctx.body = {
      code: 1,
      msg: '上传失败'
    };
  }
})
app.use(cors());
app.use(serve(UPLOAD_DIR));
app.use(router.routes()).use(router.allowedMethods());
app.listen(3000, 'localhost', undefined, () => {
  console.log('启动成功 localhost:3000');
});