<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
//import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { isAuthenticated, logout } from '@/api/authService'

import { lexicalStore } from '@/stores/store'

// sync locale in usestore and i18n
const userStore = lexicalStore()
const { locale } = useI18n()

function ChangeLocale(aLocale: string) {
  userStore.setLocale(aLocale)
  locale.value = aLocale
}

const themeCurrent = ref('light')

const isDropDownLanguage = ref(false)
const dropDownLanguageContainer = ref<HTMLElement | null>(null)

const toggleDropdownLanguage = () => {
  isDropDownLanguage.value = !isDropDownLanguage.value
}

const handleClickOutside = (event: MouseEvent) => {
  if (
    dropDownLanguageContainer.value &&
    !dropDownLanguageContainer.value.contains(event.target as Node)
  ) {
    isDropDownLanguage.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)

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

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const loginLogout = async () => {
  if (!isAuthenticated.value) {
    window.location.href = `https://sp.spraakbanken.gu.se/auth/login?redirect=${window.location}`
  } else {
    logout()
  }
}
</script>

<template>
  <nav>
    <!--
    <RouterLink to="/">{{ $t('menu.home') }}</RouterLink>
    <RouterLink to="/about">{{ $t('menu.about') }}</RouterLink>
    -->
    <span class="menu-item">
      <a href="https://spraakbanken.gu.se/karp/">
        {{ $t('menu.editmode') }}
      </a>
    </span>
    <span class="menu-item">
      <span v-on:click="loginLogout" style="cursor: pointer">
        {{ isAuthenticated ? $t('menu.logout') : $t('menu.login') }}
      </span>
    </span>

    <button id="theme-toggle" class="nav-button button-mode">
      <span class="material-icons" v-if="themeCurrent === 'light'">light_mode</span>
      <span class="material-icons" v-else>dark_mode</span>
    </button>
    <div
      class="dropdown nav-button"
      ref="dropDownLanguageContainer"
      :class="{ 'dropdown-open': isDropDownLanguage }"
    >
      <div class="dropdown-toggle" @click="toggleDropdownLanguage">
        <span class="material-icons">language</span>
        <span class="material-icons">keyboard_arrow_down</span>
        <!--<button class="nav-button">{{ $t('menu.' + locale) }}</button>-->
      </div>
      <div class="dropdown-content" v-if="isDropDownLanguage">
        <a href="#" @click.prevent="ChangeLocale('en')">
          <span
            :class="{ hidden: locale === 'sv', visible: locale === 'en' }"
            class="material-icons"
            >check</span
          >
          {{ $t('menu.en') }}
        </a>
        <a href="#" @click.prevent="ChangeLocale('sv')">
          <span
            :class="{ hidden: locale === 'en', visible: locale === 'sv' }"
            class="material-icons"
            >check</span
          >
          {{ $t('menu.sv') }}
        </a>
      </div>
    </div>
  </nav>
</template>

<style scoped>
nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  align-self: end;
  vertical-align: top;
  justify-content: right;
  width: 100%;
  font-size: 15px;
  text-align: right;
  margin-top: 1rem;
}

nav a,
.nav-button {
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
  /* border-left: 1px solid var(--color-border); */
}

nav a:first-of-type {
  border: 0;
}

nav button.button-mode {
  margin-top: 2px;
}

nav .menu-item {
  white-space: nowrap;
  padding: 0 1rem 0 0;
}
/* language selection dropdown */

.dropdown {
  position: relative;
}

.dropdown-toggle {
  display: flex;
  align-items: baseline;
  padding-left: 1rem;
  cursor: pointer;
}

.dropdown-content {
  text-align: left;
  position: absolute;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  overflow-y: auto;
  width: 160px;
  z-index: 1000;
  right: 0;
}

.dropdown-content a {
  color: var(--color-text);
  padding: 12px 16px;
  text-decoration: none;
  display: block;
}

.material-icons {
  font-size: 16px;
}

.hidden {
  visibility: hidden;
}

.visible {
  visibility: visible;
}
</style>
