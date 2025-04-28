<script setup lang="ts">
import AdditionsList from '@/components/AdditionsList.vue'
import NewsList from '@/components/NewsList.vue'

const ex1 = encodeURI(
  'https://spraakbanken.gu.se/karp-s/?resources=saol9,saol1,saol10,saol11,saol12,saol13,saol14,saol7,saol8,so2009,saol6&tab=statistics&q=startswith|ursprungligt_ord|blom&compile=normaliserat_ord',
)
const ex2 = encodeURI(
  'http://localhost:5173/karp-s/?resources=saol9,saol1,saol10,saol11,saol12,saol13,saol14,saol6,saol7,saol8,so2009&tab=graph&q=startswith|normaliserat_ord|blom&compile=normaliserat_ord',
)
</script>

<template>
  <div class="about">
    <div class="row">
      <div class="col">
        <!-- About -->
        <div>
          <h2>{{ $t('about.about.title') }}</h2>
          <p v-html="$t('about.about.text')"></p>
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
@media (min-width: 1024px) {
  .about {
    padding: 2rem;
  }

  .row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
    margin-bottom: 2rem;
  }

  .col {
    display: flex;
    flex-direction: column;
    flex-basis: 100%;
    flex: 1;
    margin-right: 2rem;
  }

  .news {
  }
}
</style>
