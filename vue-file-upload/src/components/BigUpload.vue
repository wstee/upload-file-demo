<script setup lang="ts">
import { ref } from 'vue'

const file = ref<File | null>(null)
const fileUrl = ref<string[]>([])
const file1Change = (e: Event) => {
  file.value = null
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    file.value = target.files[0]
  }
}

/**
 * 文件切片
 * @param file
 * @param size
 */
function splitChunks(file: File, size: number): Blob[] {
  const chunks: Blob[] = []
  for (let i = 0; i < file.size; i += size) {
    chunks.push(file.slice(i, i + size))
  }
  return chunks
}


function createWorker() {
  return new Worker(new URL('../assets/md5Worker.ts', import.meta.url), {
  type: 'module',
})
}
async function limitRun(funs: Function[], limit: number) {
  const results: Promise<any>[] = []
  const cache: Function[] = []
  for (let fun of funs) {
    if (cache.length >= limit) {
      await Promise.race(cache)
    }
    const promise = fun()
    results.push(promise)
    const del = promise.then(() => cache.splice(del, 1))
    cache.push(del)
  }
  return Promise.allSettled(results)
}
async function uploadChunk(chunk: Blob, md5='', filename='', index=-1): Promise<any> {
  const formData = new FormData()
  formData.append('md5', md5)
  formData.append('filename', filename)
  formData.append('index', index+'')
  formData.append('file', chunk)
  return fetch('http://localhost:3000/upload/big', {
    method: 'POST',
    body: formData,
  }).then(res => res.json())
}
async function getFileMD5(file: File): Promise<string> {
  const worker = createWorker()
  worker.postMessage(file)
  return new Promise((resolve, reject) => {
    worker.onmessage = (e) => {
      resolve(e.data)
    }
    worker.onerror = (err) => {
      reject(err)
    }
  })

}
async function checkFileExist(filename: string, md5: string): Promise<string> {
  return fetch('http://localhost:3000/fileExist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename,
      md5
    })
  }).then((res) => res.json())
}
async function uploadChunks(file: File, md5: string) {
  const chunks = splitChunks(file, 2*1024*1024)
  const uploadChunkFns = chunks.map((chunk, index) => {
    return uploadChunk.bind(null, chunk, md5, file.name, index)
  })
  const uploadRes = await limitRun(uploadChunkFns, 2)
  return uploadRes
}
const submitFile = async () => {
  const md5 = await getFileMD5(file.value!)
  // const res =  await checkFileExist(file.value!.name, md5)
  // console.log(res)
  uploadChunks(file.value!, md5)
  .then(res => {
    console.log(res)
    fetch('http://localhost:3000/upload/merge', {
      method: 'POST',
      
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        md5,
        filename: file.value!.name
      })
    })
    .then(res => res.json())
    .then((data) => {
      fileUrl.value = [data.data]
    })
    .catch(() => {
      alert('上传失败')
    })
  })
}
</script>

<template>
  <section class="demo-item">
    <h2>大文件上传</h2>
    <hr />
    <div>
      <input type="file" name="file" @change="file1Change" />
      <button :disabled="file === null" @click="submitFile">上传</button>
    </div>
    <div>
      <h3>文件链接</h3>
      <ul>
        <li v-for="url in fileUrl" :key="url"><a :href="url">{{ url }}</a></li>
      </ul>
    </div>
  </section>
</template>
