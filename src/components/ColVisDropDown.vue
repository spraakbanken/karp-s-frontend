<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { lexicalStore } from '@/stores/store'

const tableContainerDropdownOpenClass = 'table-container-dropdown-open'

const props = defineProps<{
  resourceId: string
  tableContainer: HTMLElement | null
}>()

const lexicalStorage = lexicalStore()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const updateTableContainerOverflow = (
  container: HTMLElement | null,
  isDropdownOpen: boolean,
) => {
  if (!container) {
    return
  }

  container.classList.toggle(tableContainerDropdownOpenClass, isDropdownOpen)
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const toggleItem = (index: number) => {
  /*
  const visible = lexicalStorage.columnVis[props.resourceId][index].vis
  const visibleCount = lexicalStorage.columnVis[props.resourceId].reduce((count, item) => {
    return item.vis ? count + 1 : count
  }, 0)
  if (!visible || visibleCount > 1) {
  */
  lexicalStorage.columnVis[props.resourceId][index].vis =
    !lexicalStorage.columnVis[props.resourceId][index].vis
  //}
}

const selectAll = () => {
  lexicalStorage.columnVis[props.resourceId].forEach((f) => (f.vis = true))
}

const selectNone = () => {
  lexicalStorage.columnVis[props.resourceId].forEach((f) => (f.vis = false))
  /*
  lexicalStorage.columnVis[props.resourceId].forEach((f) => {
    if (f.columnField === entryWordField) {
      f.vis = true
    }
  })
  */
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

const handleFocusOut = (event: FocusEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.relatedTarget as Node | null)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  updateTableContainerOverflow(props.tableContainer, false)
})

watch(
  [isOpen, () => props.tableContainer],
  ([isDropdownOpen, tableContainer], [_wasDropdownOpen, previousTableContainer]) => {
    if (previousTableContainer && previousTableContainer !== tableContainer) {
      updateTableContainerOverflow(previousTableContainer, false)
    }
    updateTableContainerOverflow(tableContainer, isDropdownOpen)
  },
)
</script>

<template>
  <div class="dropdown" ref="dropdownRef" @focusout="handleFocusOut">
    <button class="dropdown-button" @click="toggleDropdown">
      {{ $t('table.columnVis.select.button') }}
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
    {{
      lexicalStorage.columnVis[props.resourceId].reduce((count, item) => {
        return item.vis ? count + 1 : count
      }, 0)
    }}
    {{ $t('table.columnVis.selected.of') }}
    {{ lexicalStorage.columnVis[props.resourceId].length }}
    {{ $t('table.columnVis.selected.selected') }}
  </div>
</template>

<style scoped>
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-button {
  cursor: pointer;
  margin: 0;
  padding: 1 0.25rem 1 0.25rem;
  background-color: var(--button-action-bg-color);
  color: var(--button-action-text-color);
  font-weight: bold;
  border: 1px solid var(--sb-orange);
  border-radius: 4px;
}

.dropdown-button:hover {
  background-color: var(--button-action-bg-hover-color);
  color: var(--button-action-text-hover-color);
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
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  z-index: 1;
  width: 200px;
  max-height: 250px;
  overflow-y: auto;
  text-align: left;
  font-weight: normal;
  padding: 8px;
}

.dropdown-item {
  color: var(--color-text);
}

.dropdown-item:hover {
  background-color: var(--sb-grey-light);
}

.dropdown-item input {
  cursor: pointer;
}
</style>
