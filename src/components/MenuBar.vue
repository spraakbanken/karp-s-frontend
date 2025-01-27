<script setup lang="ts"></script>

<template>
  <nav>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/about">About</RouterLink>
  </nav>
</template>

<style scoped>
nav {
  width: 100%;
  font-size: 12px;
  text-align: left;
}

nav a.router-link-exact-active {
  color: #f0581a;
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
  color: black;
}

nav a {
  display: inline-block;
  padding: 0 0.5rem 0 0;
  color: black;
}

nav a:first-of-type {
  border: 0;
}
</style>
