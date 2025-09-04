<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { fetchNews, type NewsItem } from '@/api/news.service'
import type { ByLang } from '@/util.types'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const items = reactive<NewsItem[]>([])

// Get news from newsdesk repository
onMounted(async () => {
  try {
    const items_ = await fetchNews(false)
    items.push(...items_)
  } catch (error) {
    console.error('Could not fetch and parse news', error)
  }
})

// Format date according to locale
function getDate(date: Date) {
  return date.toLocaleDateString(locale.value, { dateStyle: 'long' })
}

// Return propeer text according to locale
function th(x?: ByLang | string): string | undefined {
  if (typeof x == 'string') return x
  if (locale.value == 'en') {
    return x['eng']
  } else {
    return x['swe']
  }
}
</script>

<template>
  <div v-if="items.length">
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
</template>

<style scoped>
@media (min-width: 1024px) {
  .newsarticle {
    margin-bottom: 0.5rem;
  }

  .newstitle {
  }

  .newsdate {
    font-style: italic;
  }

  .newsbody {
  }
}
</style>
