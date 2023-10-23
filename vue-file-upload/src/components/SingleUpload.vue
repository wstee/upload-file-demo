<script setup lang="ts">
import { ref } from 'vue'
const file = ref<File | null>(null)
const fileUrl = ref<string[]>([])
const file1Change = (e: Event) => {
  console.log(e)
  file.value = null
  const target = e.target as HTMLInputElement
  console.log(target.files)
  if (target.files && target.files[0]) {
    file.value = target.files[0]
  }
}

const submitFile = () => {
  const formData = new FormData()
  // 需先与文件否则 multer无法获取body内容
  formData.append('test', 'test')
  formData.append('file', file.value as any);
  fetch('http://localhost:3000/upload/single', {
    method: 'POST',
    body: formData
  })
  .then((response) => response.json())
  .then((data) => {
    fileUrl.value = [data.data]
  })
  .catch(() => {
    alert('上传失败')
  })
}
</script>

<template>
  <section class="demo-item">
    <h2>单文件上传</h2>
    <hr />
    <div>
      <input type="file" name="file" @change="file1Change" />
      <button :disabled="file===null" @click="submitFile">上传</button>
    </div>
    <div>
      <h3>文件链接</h3>
      <ul>
        <li v-for="url in fileUrl" :key="url"><a :href="url">{{ url }}</a></li>
      </ul>
    </div>
  </section>
</template>
