<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUser } from '@/stores/store'

// update activeLocale in store
const userStore = useUser()
const { activeLocale } = storeToRefs(userStore)
</script>

<template>
  <div class="language-switcher">
    current locale: {{ activeLocale }}
    <select v-model="$i18n.locale">
      <option v-for="locale in $i18n.availableLocales" :key="`locale-${locale}`" :value="locale">
        {{ locale }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.language-switcher {
  width: 100%;
  font-size: 10px;
  text-align: left;
  display: inline;
  padding: 0 0.5rem 0 0;
}
</style>
