<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { lexicalStore } from '@/stores/store'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  resourceId: string
}>()

const lexicalStorage = lexicalStore()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const toggleItem = (index: number) => {
  lexicalStorage.columnVis[props.resourceId][index].vis =
    !lexicalStorage.columnVis[props.resourceId][index].vis
}

const selectAll = () => {
  lexicalStorage.columnVis[props.resourceId].forEach((f) => (f.vis = true))
}

const selectNone = () => {
  lexicalStorage.columnVis[props.resourceId].forEach((f) => (f.vis = false))
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <div class="dropdown" ref="dropdownRef">
    <button class="dropdown-button" @click="toggleDropdown">
      <span class="material-icons icon-placement">view_column</span>
    </button>
    <div v-if="isOpen" class="dropdown-menu">
      <div class="dropdown-selectors">
        <button @click="selectAll()" class="tags-button-action">
          {{ $t('table.columnVis.select.all') }}
        </button>
        <button @click="selectNone()" class="tags-button-action">
          {{ $t('table.columnVis.select.none') }}
        </button>
      </div>
      <div
        v-for="(item, index) in lexicalStorage.columnVis[props.resourceId]"
        :key="index"
        class="dropdown-item"
      >
        <label>
          <input
            type="checkbox"
            :value="item"
            v-model="lexicalStorage.columnVis[props.resourceId][index].vis"
            @click="toggleItem(index)"
          />
          {{ lexicalStorage.localizeField(item.columnField) }}
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dropdown {
  position: relative;
  display: inline-block;
}
.dropdown-button {
  cursor: pointer;
  background: none;
  /*
  padding: 10px 15px;
  color: white;
  */
  border: none;
  border-radius: 5px;
}
.icon-placement {
  vertical-align: text-bottom;
  font-size: 22px;
}

.dropdown-selectors {
  display: flex;
  flex-flow: row;
  align-items: left;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}
.dropdown-selectors .tags-button-action {
  cursor: pointer;
  background-color: black;
  color: white;
  font-weight: bold;
  margin-right: 0.5rem;
  cursor: pointer;
}
.dropdown-menu {
  position: absolute;
  background-color: #fff;
  border: 1px solid var(--sb-orange);
  z-index: 1;
  width: 200px;
  max-height: 250px;
  overflow-y: auto;
  text-align: left;
  font-weight: normal;
  padding: 8px;
}
.dropdown-item {
}
.dropdown-item:hover {
  background-color: var(--sb-grey-light);
}
.dropdown-item input {
  cursor: pointer;
}
</style>
