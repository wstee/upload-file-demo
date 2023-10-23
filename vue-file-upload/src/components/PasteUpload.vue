<script setup lang="ts">
import { onMounted, ref } from 'vue'
const files = ref<FormData| null>(null)
const fileUrl = ref<string[]>([])
const dropBoxRef = ref<HTMLElement | null>(null)
const submitFile = () => {
  fetch('http://localhost:3000/upload/multiple', {
    method: 'POST',
    body: files.value
  })
  .then((response) => response.json())
  .then((data) => {
      fileUrl.value = data.data
  })
  .catch(() => {
    alert('上传失败')
  })
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryEntry/createReader
async function readDirectory(directory: FileSystemDirectoryEntry) {
  let entries: FileSystemEntry[] = [];
  let getEntries = (directory: FileSystemDirectoryEntry) => {
    let dirReader = directory.createReader();
    return new Promise((resolve, reject) => {
      dirReader.readEntries(
        async (results) => {
          if (results.length) {
            for(let entry of results) {
              console.log(entry)
              if (entry.isFile) {
                entries.push(entry);
              } else {
                await getEntries(entry as FileSystemDirectoryEntry);
              }
            }
          }
          resolve(results)
        },
        (error) => {
          console.error(error)
          reject(error)
          /* handle error — error is a FileError object */
        },
      );

    })
  };

  await getEntries(directory);
  console.log(entries)
  return entries;
}


onMounted(() => {
  dropBoxRef.value!.addEventListener('paste', async (e: ClipboardEvent) => {
    // 无法获取桌面文件
    // if(navigator.clipboard) {
    //   const items = await navigator.clipboard.read();
    //   console.log(items)
    // }
    const dragFiles = e.clipboardData!.files;
    const dataTransferItems = e.clipboardData!.items;
    const formData = new FormData();

    for(let i=0; i < dragFiles.length; i++) {
      if (dataTransferItems[i].webkitGetAsEntry()?.isFile) {
        formData.append('file', dragFiles[i]);
      } else {
        const entries = await readDirectory(dataTransferItems[i].webkitGetAsEntry() as FileSystemDirectoryEntry);
        console.log(entries)
        for(let entry of entries) {
          (entry as FileSystemFileEntry).file((file) => {
            console.log(file)
            formData.append('file', file, entry.fullPath.replace(/\//g, '@'));
          }, (err) => {
            console.error(err)
          })
        }
      }
    }
    files.value = formData;
  })
})
</script>

<template>
  <section class="demo-item">
    <h2>粘贴上传</h2>
    <hr />
    <div class="drop-box" ref="dropBoxRef">
      <span class="prompt">粘贴文件或文件夹到这里</span>
    </div>
    <button :disabled="files===null" @click="submitFile">上传</button>
    <div>
      <h3>文件链接</h3>
      <ul>
        <li v-for="url in fileUrl" :key="url"><a :href="url">{{ url }}</a></li>
      </ul>
    </div>
  </section>
</template>
<style scoped>
  .drop-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 300px;
    height: 200px;
    border: 1px solid #000;
  }
</style>
