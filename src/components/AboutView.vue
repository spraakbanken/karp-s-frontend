<script setup lang="ts">
//import { onMounted } from 'vue'

import AdditionsList from '@/components/AdditionsList.vue'
import NewsList from '@/components/NewsList.vue'
//import { lexicalStore } from '@/stores/store'
import packageJson from '../../package.json'
const apiUrl = import.meta.env.VITE_API_URL

//const lexicalStorage = lexicalStore()

const ex1 = encodeURI(
  '/karp/?resources=saol1-faksimil,saol9-faksimil,saol10-faksimil,saol11-faksimil,saol12-faksimil,saol13-faksimil,saol14-faksimil,so2009-ord&resultTab=table&q=startswith|entry_word|blom',
)

const ex2 = encodeURI(
  '/karp/?resources=saol9-faksimil,saol1-faksimil,saol10-faksimil,saol11-faksimil,saol12-faksimil,saol13-faksimil,saol14-faksimil,saol7-faksimil,saol8-faksimil,saol6-faksimil,so2009-ord&resultTab=statistics&q=startswith|entry_word|blom&compile=entry_word&columns=entry_word',
)

const ex3 = encodeURI(
  '/karp/?resources=saol9-faksimil,saol1-faksimil,saol10-faksimil,saol11-faksimil,saol12-faksimil,saol13-faksimil,saol14-faksimil,saol7-faksimil,saol8-faksimil,saol6-faksimil,so2009-ord&resultTab=table&q=and(or(startswith|entry_word|pest||startswith|entry_word|kolera)||not(equals|upos|NOUN))&searchTab=extended',
)

const ex4 = encodeURI('/karp/?resources=isof-nyord&q=endswith|entry_word|"+ekonomi"')

/*
onMounted(async () => {
  lexicalStorage.setIsStart(false)
})
  */
</script>

<template>
  <div class="about">
    <div class="row">
      <!-- About -->
      <div>
        <h2>{{ $t('about.about.title') }}</h2>
        <p v-html="$t('about.about.text')"></p>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <!-- About -->
        <div>
          <h2>{{ $t('about.about.infotitle') }}</h2>
          <p v-html="$t('about.about.info')"></p>
          <p><b>Front-end:</b> {{ packageJson.version }}</p>
          <p><b>Back-end:</b> {{ apiUrl }}</p>
        </div>
      </div>
      <div class="col">
        <!-- Examples -->
        <div class="examples">
          <h2>{{ $t('about.examples.title') }}</h2>
          <ul>
            <li>
              <a :href="ex2">{{ $t('about.examples.ex2') }}</a>
            </li>
            <li>
              <a :href="ex1">{{ $t('about.examples.ex1') }}</a>
            </li>
            <li>
              <a :href="ex3">{{ $t('about.examples.ex3') }}</a>
            </li>
            <li>
              <a :href="ex4">{{ $t('about.examples.ex4') }}</a>
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
  margin-bottom: 1rem;
  padding: 2rem;
  width: 800px;
  border-radius: 0.5rem;
  background-color: var(--color-background-alt2);
  @media (width < 800px) {
    width: 100%;
    flex-direction: column;
  }
}

.row {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  @media (width < 800px) {
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

.examples ul {
  padding-left: 1rem;
  margin-top: 0;
  margin-bottom: 1rem;
}
</style>
