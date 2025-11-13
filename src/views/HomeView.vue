<script setup lang="ts">
import { onMounted, ref, watch, reactive } from 'vue'
import { fetchNews, type NewsItem } from '@/api/news.service'

import { lexicalStore } from '../stores/store'
import DataSearch from '@/components/DataSearch.vue'
import TableView from '@/components/TableView.vue'
import StatisticsView from '@/components/StatisticsView.vue'
import AboutView from '@/components/AboutView.vue'
//import DataSelection from '@/components/DataSelection.vue'

//import { getLexicalDatasets } from '@/api/apiService'
import { th, getDate } from '@/utils/utils'

//import router from '@/router'
//import { syncStoreWithRouter } from '@/router/syncStoreWithRouter'

const lexicalStorage = lexicalStore()

/*
onMounted(async () => {
  try {
    const datasets = await getLexicalDatasets()
    lexicalStorage.setDefault(datasets)
    if (syncStoreWithRouter(router)) {
      lexicalStorage.setIsStart(false)
      lexicalStorage.setIsSearch(true)
    }
  } catch (error) {
    console.error(error)
  }
})
*/

const items = reactive<NewsItem[]>([])

onMounted(async () => {
  /*
  if (syncStoreWithRouter(router)) {
    lexicalStorage.setIsStart(false)
    lexicalStorage.setIsSearch(true)
  }
*/
  try {
    const items_ = await fetchNews(true)
    items.push(...items_)
  } catch (error) {
    console.error('Could not fetch and parse news', error)
  }
})

const activeResultTab = ref(lexicalStorage.activeResultTab)
const setActiveResultTab = (tab: string) => {
  lexicalStorage.setActiveResultTab(tab)
  activeResultTab.value = tab
}

watch(
  () => lexicalStorage.activeResultTab,
  (newTab) => {
    activeResultTab.value = newTab
    //console.log('WATCH lexicalStorage.activeResultTab', activeResultTab.value)
  },
)
</script>

<template>
  <main
    class="container"
    :class="{
      'container-center': lexicalStorage.isStart,
    }"
  >
    <!-- <div class="datasearch-header">{{ $t('dataselector.datasearch') }}</div>-->
    <div class="search">
      <DataSearch />
    </div>

    <!-- featured news -->
    <div v-if="items.length && lexicalStorage.isStart" class="message-featured">
      <article v-for="(item, i) in items" :key="i" class="newsarticle">
        <header class="">
          <h3 class="newstitle">{{ th(item.title) }}</h3>
          <time :datetime="item.created.toString()" class="newsdate">
            {{ getDate(item.created) }}
          </time>
        </header>
        <div class="newsbody" v-html="th(item.body)"></div>
      </article>
    </div>

    <!-- <template v-if="lexicalStorage.isData"> -->
    <template v-if="!lexicalStorage.isStart">
      <div class="tabs">
        <button
          :class="{ active: activeResultTab === 'table' }"
          @click="setActiveResultTab('table')"
        >
          {{ $t('tab.tables') }}
        </button>
        <button
          :class="{ active: activeResultTab === 'statistics' }"
          @click="setActiveResultTab('statistics')"
        >
          {{ $t('tab.statistics') }}
        </button>
      </div>
    </template>

    <div>
      <TableView v-if="activeResultTab === 'table'" />
      <StatisticsView v-if="activeResultTab === 'statistics'" />
      <AboutView v-if="lexicalStorage.isStart" />
    </div>
  </main>
</template>

<style scoped>
.container {
  padding: 0;
}

/*
.container-center {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-right: -50%;
  transform: translate(-50%, -50%);
}
*/
.container .search {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-start;
  width: 100vw;
}

.column-left {
  padding: 0%;
}

.column-right {
  padding: 0rem 0;
}
.column-left:nth-child(1) {
  border-right: 2px solid var(--border-color);
}

.search-container {
  align-items: center;
}

.datasearch-header {
  height: 2.5rem;
  padding-top: 0.5rem;
  padding-left: 1rem;
  background-color: var(--color-complement);
  font-size: medium;
  font-weight: bold;
}

.searchTabs,
.tabs {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 0rem;
  /*border-bottom: 2px solid var(--border-color);*/
  padding-left: 1rem;
  padding-top: 0.5rem;
  background-color: var(--color-complement);
  height: 2.5rem;
}

.searchTabs button,
.tabs button {
  padding: 0.5rem 1rem;
  margin: 0;
  border: none;
  color: var(--button-inactive-text-color);
  background-color: var(--button-inactive-bg-color);
  cursor: pointer;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  font-size: var(--font-size);
  font-weight: bold;
  transition:
    background-color 0.3s,
    color 0.3s;
}

.searchTabs button.active,
.tabs button.active {
  color: black;
  font-weight: bold;
  /*
    color: var(--button-active-text-color);
  background-color: var(--button-active-bg-color);
  */
  background-color: white;
}

/* News, featured */
.newsarticle {
  margin-bottom: 0.5rem;
  width: 600px;
  margin: auto;
  text-align: center;
}

.newstitle {
}

.newsdate {
  font-style: italic;
}

.newsbody {
}
</style>
