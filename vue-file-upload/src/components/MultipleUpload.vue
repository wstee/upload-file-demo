<script setup lang="ts">
import { ref } from 'vue'
const files = ref<FileList| null>(null)
const fileUrl = ref<string[]>([])
const fileChange = (e: Event) => {
  console.log(e)
  files.value = null
  const target = e.target as HTMLInputElement
  console.log(target.files)
  if (target.files && target.files[0]) {
    files.value = target.files
  }
}
const submitFile = () => {
  const formData = new FormData()
  for(let file of files.value!) {
    formData.append('file', file);
  }
  fetch('http://localhost:3000/upload/multiple', {
    method: 'POST',
    body: formData
  })
  .then((response) => response.json())
  .then((data) => {
    fileUrl.value = data.data
  })
  .catch(() => {
    alert('上传失败')
  })
}
</script>

<template>
  <section class="demo-item">
    <h2>多文件上传</h2>
    <hr />
    <div>
      <input type="file" name="file" multiple @change="fileChange" />
      <button :disabled="files===null" @click="submitFile">上传</button>
    </div>
    <div>
      <h3>文件链接</h3>
      <ul>
        <li v-for="url in fileUrl" :key="url"><a :href="url">{{ url }}</a></li>
      </ul>
    </div>
  </section>
</template>
