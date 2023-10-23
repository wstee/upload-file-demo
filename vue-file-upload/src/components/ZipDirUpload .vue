<script setup lang="ts">
import { ref } from 'vue'
import JSZip from 'jszip'
const file = ref<any>(null)
const fileUrl = ref<string[]>([])
function generateZipFile(
  zipName: string, files: FileList,
  options: any = { type: "blob", compression: "DEFLATE" }
) {
  return new Promise((resolve, reject) => {
    const zip = new JSZip();
    for (let i = 0; i < files.length; i++) {
      zip.file(files[i].webkitRelativePath, files[i]);
    }
    zip.generateAsync(options).then(function (blob) {
      zipName = zipName || Date.now() + ".zip";
      const zipFile = new File([blob as any], zipName, {
        type: "application/zip",
      });
      resolve(zipFile);
    });
  });
}

const fileChange = async (e: Event) => {
  console.log(e)
  file.value = null
  const target = e.target as HTMLInputElement
  console.log(target.files)
  if (target.files && target.files[0]) {
    const zipName = target.files[0].webkitRelativePath.split('/')[0] + '.zip'
    const zipFile = await generateZipFile(zipName, target.files)
    file.value = zipFile
  }
}
const submitFile = () => {
  const formData = new FormData()
  
  formData.append('file', file.value);
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
    <h2>压缩文件、目录上传</h2>
    <hr />
    <div>
      <input type="file" name="file" webkitdirectory @change="fileChange" />
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
