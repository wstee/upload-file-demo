import SparkMD5 from 'spark-md5';
  
function calcFileMD5(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunkSize = 2 * 1024 * 1024 // 2M
    const chunks = Math.ceil(file.size / chunkSize)
    let currentChunk = 0
    const spark = new SparkMD5.ArrayBuffer()
    const fileReader = new FileReader()

    fileReader.onload = (e) => {
      spark.append(e.target!.result as ArrayBuffer)
      currentChunk++

      if (currentChunk < chunks) {
        loadNext()
      } else {
        console.log('finished md5')
        resolve(spark.end())
      }
    }

    fileReader.onerror = () => {
      reject(fileReader.error)
    }

    function loadNext() {
      const start = currentChunk * chunkSize,
        end = start + chunkSize >= file.size ? file.size : start + chunkSize
      fileReader.readAsArrayBuffer(file.slice(start, end))
    }
    loadNext()
  })
}
onmessage = async (e) => {
  const md5 = await calcFileMD5(e.data)
  postMessage(md5)
}