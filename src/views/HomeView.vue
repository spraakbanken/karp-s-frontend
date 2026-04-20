<script setup lang="ts">
import { onMounted, ref, watch, reactive } from 'vue'
import { fetchNews, type NewsItem } from '@/api/news.service'
import { testForLogin } from '@/api/authService'

import { lexicalStore } from '../stores/store'
import TitleBar from '@/components/TitleBar.vue'
import FooterView from '@/components/FooterView.vue'
import DataSearch from '@/components/DataSearch.vue'
import TableView from '@/components/TableView.vue'
import StatisticsView from '@/components/StatisticsView.vue'
import AboutView from '@/components/AboutView.vue'

import { th, getDate } from '@/utils/utils'
import TabRefView from '@/components/TabRefView.vue'
//import { useDark } from '@vueuse/core'

import { getLexicalConfig } from '@/api/apiService'
import { syncStoreWithRouter, SyncResult } from '@/router/syncStoreWithRouter'
import router from '@/router'
import {
  TAB_RESULT_REF,
  TAB_RESULT_STATISTICS,
  TAB_RESULT_TABLE,
  TAB_SEARCH_SIMPLE,
} from '@/utils/constants'

const lexicalStorage = lexicalStore()

// was syncing with URL successful?
const syncResult = ref<SyncResult>(SyncResult.SYNC_RESULT_NOT_SYNCED)

// reference tabs
const tabRefSetup = reactive(lexicalStorage.tabRefSetup)
const limit_tabref = (t: string) => {
  return t.length > 15 ? t.substring(0, 15) + '...' : t
}

// newsitems
const items = reactive<NewsItem[]>([])

onMounted(async () => {
  // does user prefer dark mode?
  /*
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  if (mediaQuery.matches) {
    document.documentElement.setAttribute('data-theme', 'dark')
  }
  */

  // read config
  try {
    const config = await getLexicalConfig()
    lexicalStorage.setDefault(config)
    syncResult.value = syncStoreWithRouter(router)

    if (syncResult.value === SyncResult.SYNC_RESULT_SYNCED) {
      lexicalStorage.setIsStart(false)
      //TODO lexicalStorage.setIsSearch(true)
    } else if (syncResult.value === SyncResult.SYNC_RESULT_DATASET_UNKNOWN) {
      //lexicalStorage.setDefault(config)
    }
  } catch (error) {
    console.error(error)
  }

  // read news
  try {
    const items_ = await fetchNews(true)
    items.push(...items_)
  } catch (error) {
    console.error('Could not fetch and parse news', error)
  }

  //lexicalStorage.setActiveSearchTab(TAB_SEARCH_SIMPLE)

  // is user logged in?
  await testForLogin()
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
  },
)

const tabRefClose = (id: number) => {
  lexicalStorage.delTabRef(id)
  setActiveResultTab(TAB_RESULT_STATISTICS)
}
</script>

<template>
  <div class="wrapper">
    <header>
      <TitleBar />
    </header>
    <div
      v-if="syncResult === SyncResult.SYNC_RESULT_DATASET_UNKNOWN && lexicalStorage.isStart"
      class="message-error"
    >
      {{ $t('url.dataset.unknown') }}
    </div>
    <div class="main">
      <main
        class="container"
        :class="{
          'container-center': lexicalStorage.isStart,
        }"
      >
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
              :class="{ active: activeResultTab === TAB_RESULT_TABLE }"
              @click="setActiveResultTab(TAB_RESULT_TABLE)"
            >
              {{ $t('tab.tables') }}
            </button>
            <button
              :class="{ active: activeResultTab === TAB_RESULT_STATISTICS }"
              @click="setActiveResultTab(TAB_RESULT_STATISTICS)"
            >
              {{ $t('tab.statistics') }}
            </button>
            <template v-for="(tabRef, key) in tabRefSetup" :key="key">
              <button :class="{ active: activeResultTab === TAB_RESULT_REF + key }">
                <span @click="setActiveResultTab(TAB_RESULT_REF + key)">
                  <span class="material-icons icon-placement">arrow_forward</span
                  >{{ limit_tabref(tabRef.columnValue) }}</span
                >
                <span
                  @click="tabRefClose(Number(key))"
                  class="material-icons icon-placement"
                  style="margin-left: 0.5rem"
                  >cancel</span
                >
              </button>
            </template>
          </div>
        </template>

        <div>
          <TableView v-if="activeResultTab === TAB_RESULT_TABLE && !lexicalStorage.isStart" />
          <StatisticsView v-if="activeResultTab === TAB_RESULT_STATISTICS" />
          <div v-for="(tabRef, key) in tabRefSetup" :key="key">
            <TabRefView
              v-if="activeResultTab === TAB_RESULT_REF + key"
              :id="Number(key)"
              :resourceId="tabRef.resourceId"
              :columnField="tabRef.columnField"
              :columnValue="tabRef.columnValue"
            />
          </div>
          <AboutView v-if="lexicalStorage.isStart" />
        </div>
      </main>
    </div>
    <footer class="footer">
      <FooterView />
    </footer>
  </div>
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
}

.column-left {
  padding: 0%;
}

.column-right {
  padding: 0rem 0;
}
.column-left:nth-child(1) {
  border-right: 2px solid var(--color-border);
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
  padding-left: 1rem;
  padding-top: 0.5rem;
  height: 2.5rem;
  background-color: var(--color-background);
}

.searchTabs button,
.tabs button {
  padding: 0.5rem 1rem;
  margin: 0;
  border: none;
  color: var(--color-text);
  background-color: var(--color-background-alt2);
  border-width: 0;
  cursor: pointer;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-color: white;
  border-top-style: solid;
  border-left-style: solid;
  border-right-style: solid;
  font-size: var(--font-size);
  font-weight: bold;
  margin-right: 0.25rem;
  overflow: hidden;
}

.searchTabs button.active,
.tabs button.active {
  font-weight: bold;
  background-color: var(--color-background-alt);
}

.icon-placement {
  vertical-align: top;
  font-size: 22px;
}

/* News, featured */

.message-featured {
  padding-top: 0.25rem;
}

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

.wrapper {
  display: flex;
  flex-direction: column;
}

header {
  line-height: 1.5;
  max-height: 100vh;
  /*width: 100vw;*/
}

footer {
  height: 150px;
}

.main {
  flex: 1;
}
</style>
