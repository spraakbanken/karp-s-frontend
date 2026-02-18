<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { lexicalStore } from '@/stores/store'
import { useI18n } from 'vue-i18n'
import { entryWordField, type ColumnVisField } from '@/types/datasetConfig'

const lexicalStorage = lexicalStore()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

interface VisField {
  name: string
  label: string
  vis: boolean
}

const visibleFields = ref<VisField[]>([])

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const toggleItem = (index: number) => {
  const fieldName = visibleFields.value[index].name
  visibleFields.value[index].vis = !visibleFields.value[index].vis
  for (const ds of lexicalStorage.selectedDatasets) {
    const colfi = lexicalStorage.columnVis[ds].find((f) => f.columnField === fieldName)
    if (colfi !== undefined) {
      colfi.vis = visibleFields.value[index].vis
    }
  }
}

const selectAll = () => {
  for (const ds of lexicalStorage.selectedDatasets) {
    lexicalStorage.columnVis[ds].forEach((f) => (f.vis = true))
  }
  updateGlobalVis()
}

const selectNone = () => {
  for (const ds of lexicalStorage.selectedDatasets) {
    lexicalStorage.columnVis[ds].forEach((f) => (f.vis = false))
  }
  updateGlobalVis()
}

const selectPrimary = () => {
  // code from setSelectedDataset()
  lexicalStorage.columnVis = {}
  for (const ds of lexicalStorage.selectedDatasets) {
    const result: ColumnVisField[] = lexicalStorage.fieldsInDatasets[ds].map((f) => ({
      columnField: f.name,
      vis: true,
    }))
    lexicalStorage.columnVis[ds] = [...result]
    lexicalStorage.columnVis[ds].unshift({ columnField: entryWordField, vis: true })
    const res = lexicalStorage.currentConfig.resources.find((item) => item.resourceId === ds)
    if (res !== undefined) {
      for (const fi of res.fields) {
        const colfi = lexicalStorage.columnVis[ds].find((item) => item.columnField === fi.name)
        if (colfi !== undefined) {
          colfi.vis = fi.primary
        }
      }
    }
  }
  updateGlobalVis()
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

const updateGlobalVis = () => {
  visibleFields.value = []
  // common fields
  lexicalStorage.currentFields.forEach((item) => {
    let label: string = item.name // fallback
    if (lexicalStorage.activeLocale == 'sv') {
      label = item.label.swe ? item.label.swe : item.label
    } else {
      label = item.label.eng ? item.label.eng : item.label
    }
    // visible - primary
    let fieldVis: boolean = false
    for (const ds of lexicalStorage.selectedDatasets) {
      const res = lexicalStorage.currentConfig.resources.find((item) => item.resourceId === ds)
      if (res !== undefined) {
        const colfi = lexicalStorage.columnVis[ds].find((f) => f.columnField === item.name)
        if (colfi !== undefined) {
          fieldVis = colfi.vis
          break
        }
      }
    }
    // not common fields are marked in template
    visibleFields.value.push({ name: item.name, label: label, vis: fieldVis })
  })
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  updateGlobalVis()
})
</script>

<template>
  <div class="dropdown" ref="dropdownRef">
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
        <button @click="selectPrimary()" class="tags-button-action">
          {{ $t('table.columnVis.select.primary') }}
        </button>
      </div>
      <div v-for="(item, index) in visibleFields" :key="index" class="dropdown-item">
        <label>
          <input type="checkbox" :value="item.vis" v-model="item.vis" @click="toggleItem(index)" />
          {{ item.label }}
        </label>
        <span style="float: right">
          <img
            height="16px"
            src="@/assets/sb_symbol_exclamation.svg"
            class="datasets-icon"
            v-if="
              !lexicalStorage.currentCommonFields.find(
                (commonField) => commonField.name === item.name,
              )
            "
            :title="$t('search.field.notcommon')"
          />
        </span>
      </div>
    </div>

    {{
      visibleFields.reduce((count, item) => {
        return item.vis ? count + 1 : count
      }, 0)
    }}
    {{ $t('table.columnVis.selected.of') }} {{ visibleFields.length }}
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
  margin: 0 0rem 0rem 1rem;
  padding: 0.5;
  background-color: var(--button-action-bg-color);
  color: var(--button-action-text-color);
  border-radius: 4px;
  border: 0;
  font-weight: bold;
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

.item-common {
  font-weight: bold;
}
</style>
