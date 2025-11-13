<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()
</script>

<template>
  <button class="inline-block" :disabled="disabled">
    <slot />
  </button>
</template>
