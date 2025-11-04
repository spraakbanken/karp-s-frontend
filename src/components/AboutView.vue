<script setup lang="ts">
//import { onMounted } from 'vue'

import AdditionsList from '@/components/AdditionsList.vue'
import NewsList from '@/components/NewsList.vue'
//import { lexicalStore } from '@/stores/store'
import packageJson from '../../package.json'
const apiUrl = import.meta.env.VITE_API_URL

//const lexicalStorage = lexicalStore()

const ex1 = encodeURI(
  '/karp-s/?resources=saol9,saol1,saol10,saol11,saol12,saol13,saol14,saol7,saol8,so2009,saol6&tab=table&q=startswith|entry_word|blom',
)
//  '/karp-s/?resources=saol9,saol1,saol10,saol11,saol12,saol13,saol14,saol7,saol8,so2009,saol6&tab=statistics&q=startswith|ursprungligt_ord|blom&compile=normaliserat_ord',

const ex2 = encodeURI(
  '/karp-s/?resources=saol9,saol1,saol10,saol11,saol12,saol13,saol14,saol7,saol8,so2009,saol6&tab=statistics&q=startswith|entry_word|blom&compile=entry_word&columns=entry_word',
)
//  'https://spraakbanken.gu.se/karp-s/?resources=saol9,saol1,saol10,saol11,saol12,saol13,saol14,saol6,saol7,saol8,so2009&tab=graph&q=startswith|normaliserat_ord|blom&compile=normaliserat_ord',
/*
onMounted(async () => {
  lexicalStorage.setIsStart(false)
})
  */
</script>

<template>
  <div class="about">
    <div class="row">
      <div class="col">
        <!-- About -->
        <div>
          <h2>{{ $t('about.about.title') }}</h2>
          <p v-html="$t('about.about.text')"></p>
          <p><b>Front-end:</b> {{ packageJson.version }}</p>
          <p><b>Back-end:</b> {{ apiUrl }}</p>
        </div>
      </div>
      <div class="col">
        <!-- Examples -->
        <div>
          <h2>{{ $t('about.examples.title') }}</h2>
          <ul>
            <li>
              <a :href="ex1">{{ $t('about.examples.ex1') }}</a>
            </li>
            <li>
              <a :href="ex2">{{ $t('about.examples.ex2') }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <!-- Latest lexicons/datasets -->
        <div>
          <h2>{{ $t('about.additions.title') }}</h2>
          <!-- <p>{{ $t('about.additions.text') }}</p> -->
          <div class="additions">
            <AdditionsList />
          </div>
        </div>
      </div>
      <div class="col">
        <!-- News -->
        <div>
          <h2>{{ $t('about.news.title') }}</h2>
          <div class="news">
            <NewsList />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about {
  margin: auto;
  padding: 2rem;
  width: 800px;
}

.row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
  @media (width < 640px) {
    width: 400px;
    flex-direction: column;
  }
}

.col {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-right: 2rem;
  margin-bottom: 2rem;
}

p {
  margin-bottom: 0.5rem;
}
</style>
