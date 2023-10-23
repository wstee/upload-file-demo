<script setup lang="ts">
import SingleUpload from './SingleUpload.vue';
import MultipleUpload from './MultipleUpload.vue';
import DirUpload from './DirUpload.vue';
import ZipDirUpload from './ZipDirUpload .vue';
import DropUpload from './DropUpload.vue';
import PasteUpload from './PasteUpload.vue';
import BigUpload from './BigUpload.vue';
</script>

<template>
  <div class="container">
    <h1 class="green">上传demo</h1>

    <SingleUpload />
    <MultipleUpload />
    <DirUpload />
    <ZipDirUpload />
    <DropUpload />
    <PasteUpload />
    <BigUpload />
  </div>
</template>

<style>
.container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
}
h1 {
  flex-shrink: 0;
  width: 100%;
  margin: 0;
  padding: 0;
  text-align: center;
  font-weight: 500;
  font-size: 2.6rem;
}
.demo-item {
  flex: 1;
  padding: 10px;
}
</style>
