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

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <div class="dropdown" ref="dropdownRef">
    <button class="dropdown-button" @click="toggleDropdown">
      <!--      <span class="material-icons icon-placement">view_column</span>-->
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
    {{ $t('table.columnVis.selected.of') }} {{ lexicalStorage.columnVis[props.resourceId].length }}
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
  border: none;
  /* border-radius: 5px; */
  margin: 0;
  padding: 0.5;
  background-color: var(--button-action-bg-color);
  color: var(--button-action-text-color);
  font-weight: bold;
  border: 0;
  border-radius: 4px;
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
}
.dropdown-item:hover {
  background-color: var(--sb-grey-light);
}
.dropdown-item input {
  cursor: pointer;
}
</style>
