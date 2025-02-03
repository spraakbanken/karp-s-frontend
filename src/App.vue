<script setup lang="ts">
import { RouterView } from 'vue-router'
import TitleBar from './components/TitleBar.vue'
import FooterView from './components/FooterView.vue'
</script>

<template>
  <header>
    <TitleBar />
  </header>

  <RouterView />

  <footer>
    <FooterView />
  </footer>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

footer {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: nowrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
