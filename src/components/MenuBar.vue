<script setup lang="ts">
import { ref, onMounted } from 'vue'
//import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { lexicalStore } from '@/stores/store'

// sync locale in usestore and i18n
const userStore = lexicalStore()
const { locale } = useI18n()

function ChangeLocale(aLocale: string) {
  userStore.setLocale(aLocale)
  locale.value = aLocale
}

const themeCurrent = ref('light')

onMounted(() => {
  const themeToggle = document.getElementById('theme-toggle')

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      if (document.documentElement.getAttribute('data-theme') === 'dark') {
        themeCurrent.value = 'light'
        document.documentElement.setAttribute('data-theme', 'light')
      } else {
        document.documentElement.setAttribute('data-theme', 'dark')
        themeCurrent.value = 'dark'
      }
    })
  }
})
</script>

<template>
  <nav>
    <!--
    <RouterLink to="/">{{ $t('menu.home') }}</RouterLink>
    <RouterLink to="/about">{{ $t('menu.about') }}</RouterLink>
    -->
    <button id="theme-toggle" class="nav-button button-mode">
      <span class="material-icons theme-icon" v-if="themeCurrent === 'light'">light_mode</span>
      <span class="material-icons theme-icon" v-else>dark_mode</span>
    </button>
    <div class="dropdown">
      <div class="dropdown-toggle">
        <span class="material-icons">language</span>
        <button class="nav-button">{{ $t('menu.' + locale) }}</button>
      </div>
      <div class="dropdown-content">
        <a href="#" @click.prevent="ChangeLocale('en')">{{ $t('menu.en') }}</a>
        <a href="#" @click.prevent="ChangeLocale('sv')">{{ $t('menu.sv') }}</a>
      </div>
    </div>
  </nav>
</template>

<style scoped>
nav {
  display: flex;
  flex-direction: row;
  align-items: top;
  vertical-align: top;
  justify-content: right;
  width: 100%;
  font-size: 15px;
  text-align: right;
  margin-top: 1rem;
}

nav a,
nav button.nav-button {
  color: var(--color-text);
  text-decoration: none;
  /* padding: 0.5rem 1rem; */
  transition:
    color 0.3s,
    background-color 0.3s;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 15px;
}

nav a.router-link-exact-active,
nav button.nav-button-active {
  color: var(--sb-orange);
}

nav a.router-link-exact-inactive {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  /* border-left: 1px solid var(--color-border); */
}

nav a:first-of-type {
  border: 0;
}

nav button.button-mode {
  margin-top: 2px;
}

.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-content {
  display: none;
  position: absolute;
  background-color: var(--color-background);
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.dropdown:hover .dropdown-content {
  display: block;
}

.dropdown-content a {
  color: var(--color-text);
  padding: 12px 16px;
  text-decoration: none;
  display: block;
}

.dropdown-content a:hover {
  background-color: hsla(160, 100%, 37%, 0.2);
}

.dropdown-toggle {
  display: flex;
  align-items: center;
  padding-left: 1rem;
}

.material-icons {
  font-size: 20px;
}

.theme-icon {
  /* color: var(--color-icon-mode); */
}
</style>
