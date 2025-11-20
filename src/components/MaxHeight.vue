<script setup lang="ts">
import { ref } from 'vue'
import { useElementSize, useToggle } from '@vueuse/core'
import { PhCaretDoubleDown, PhCaretDoubleUp } from '@phosphor-icons/vue'
import ActionButton from '@/components//ActionButton.vue'

defineProps<{
  /** Maximum height (px). */
  maxHeight: number
}>()

const el = ref(null)
const { height } = useElementSize(el)
const [expanded, toggleExpanded] = useToggle()
</script>

<template>
  <div>
    <!-- Outer wrapper, whose height gets limited -->
    <div
      class="overflow-auto"
      :class="{ mask: !expanded && height > maxHeight }"
      :style="{
        // Set max height to slightly less than requested, to avoid ridiculously small differences between closed and expanded heights.
        maxHeight: !expanded ? maxHeight - 5 + 'px' : undefined,
      }"
    >
      <!-- Inner wrapper, of which height is measured (content's intrinsic height) -->
      <div ref="el">
        <slot />
      </div>
    </div>
    <div v-if="height > maxHeight" class="button-div">
      <ActionButton class="button-slim" @click="toggleExpanded()">
        <PhCaretDoubleUp v-if="expanded" class="button-detail" />
        <PhCaretDoubleDown v-else class="button-detail" />
        {{ expanded ? $t('expand.close') : $t('expand.open') }}
      </ActionButton>
    </div>
  </div>
</template>

<style scoped>
.mask {
  mask-image: linear-gradient(to top, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) 0em);
  /*mask-image: linear-gradient(to top, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) 4em);*/
}
.button-detail {
  display: inline;
}

.overflow-auto {
  overflow: hidden;
}

.button-div {
  text-align: left;
  padding: 2px;
  font-size: small;
}

.button-slim {
  background-color: var(--sb-grey-dark);
  color: white;
  font-weight: bold;
}
.button-detail {
}
</style>
