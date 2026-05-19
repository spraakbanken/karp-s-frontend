<script setup lang="ts">
import { ref } from 'vue'
import { useToggle } from '@vueuse/core'
import type { ColumnVisField, EntryS } from '@/types/datasetConfig'
import { formatCell, isImage } from '@/utils/utils'
import { isNumber } from 'es-toolkit/compat'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const baseUrl = import.meta.env.BASE_URL

const props = defineProps<{
  /** Maximum height (px). */
  maxHeight: number
  value1: {
    entry: EntryS[]
    resourceId: string
  }
  fa: ColumnVisField[]
  showCompact: boolean
}>()

const thflag = ref(false)
const tdRefs = ref([])
const isTooTall = () => {
  if (tdRefs.value.length > 0) {
    let h = 0
    tdRefs.value.forEach((element) => (h = element.offsetHeight > h ? element.offsetHeight : h))
    //console.log('tdrefs len:', tdRefs.value.length, h, props.value1.resourceId)
    thflag.value = h > props.maxHeight
    return h > props.maxHeight
  } else {
    return false
  }
}
const [expanded, toggleExpanded] = useToggle()
</script>

<template>
  <tr :class="{ 'limited-height': !expanded && isTooTall() }">
    <template v-for="(value2, key) in value1.entry" :key="key">
      <td v-if="thflag && key === 0" class="button-span" @click="toggleExpanded()">
        <font-awesome-icon
          :icon="['fas', expanded ? 'chevron-down' : 'chevron-right']"
          class="fa-icon"
        />
      </td>
      <td v-else-if="key === 0 && showCompact"></td>
      <td
        ref="tdRefs"
        v-if="props.fa.find((f) => f.columnField === value2.name)?.vis"
        class="table-data"
      >
        <div :class="{ 'mhr-div': !expanded && thflag, numeric: isNumber(value2.value) }">
          <span :style="isImage(value2.value) ? 'white-space: nowrap' : ''">
            <!--<span style="white-space: nowrap">-->

            <span v-html="formatCell(value2.value)"></span>
            <span v-if="isImage(value2.value)">
              <a
                :href="baseUrl + 'img?img=' + value2.value"
                class="action-link"
                target="_blank"
                :title="t('table.imgbrowse')"
              >
                <font-awesome-icon :icon="['fas', 'images']" />
              </a>
            </span>
          </span>
        </div>
      </td>
    </template>
  </tr>
</template>

<style src="@/assets/table.css" scoped></style>

<!-- fix styles in fields including HTML/style info, eg fula-ordboken -->
<style>
p {
  margin-top: 0px;
  margin-bottom: 0px;
}

p:not(:last-of-type) {
  margin-bottom: 1rem;
}
</style>

<style scoped>
.limited-height {
  max-height: 26px;
  overflow: hidden;
}

.mhr-div {
  max-height: 26px;
  overflow: hidden;
}

.overflow-auto {
  overflow: hidden;
}

.button-span {
  margin: 0;
  padding: 0;
  cursor: pointer;
  vertical-align: text-bottom;
  border: none;
}

.button-slim {
  background-color: var(--sb-grey-dark);
  color: white;
  font-weight: bolder;
  font-size: larger;
}

.numeric {
  text-align: right;
}

.action-link {
  vertical-align: top;
  font-size: 0.8rem;
  text-decoration: none;
}

.fa-icon {
  font-size: 0.9rem;
  margin-top: 0.25rem;
}
</style>
