<script setup lang="ts"></script>

<template>
  <div class="language-switcher">
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
