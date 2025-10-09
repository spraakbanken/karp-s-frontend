<script setup lang="ts">
import { onMounted } from 'vue'
import { lexicalStore } from '@/stores/store'

import { RouterView } from 'vue-router'
import TitleBar from './components/TitleBar.vue'
import FooterView from './components/FooterView.vue'
import { getLexicalDatasets } from '@/api/apiService'

const lexicalStorage = lexicalStore()

onMounted(async () => {
  try {
    const datasets = await getLexicalDatasets()
    lexicalStorage.setDefault(datasets)
  } catch (error) {
    console.error(error)
  }
})
</script>

<template>
  <div class="wrapper">
    <header>
      <TitleBar />
    </header>
    <div class="main">
      <RouterView />
    </div>
    <footer class="footer">
      <FooterView />
    </footer>
  </div>
</template>

<style scoped>
.wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  line-height: 1.5;
  max-height: 100vh;
  width: 100vw;
  /* border-bottom: 2px solid var(--border-color); */
}

footer {
  height: 150px;
}

.main {
  flex: 1;
}
/*
@media (max-width: 1024px) {
  .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: nowrap;
    place-items: left;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
  */
</style>
