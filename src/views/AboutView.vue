<script setup lang="ts">
import AdditionsList from '@/components/AdditionsList.vue'
import NewsList from '@/components/NewsList.vue'

const transformLinks = (text: string) => {
  const linkExpr = /\[\[(.*?)\]\]/gi
  const linkValueExpr = /(\s+\|\s+)/
  return text.replace(linkExpr, (expr, value) => {
    const parts = value.split(linkValueExpr)
    const link = `<a href="${parts[0]}">${parts[2]}</a>`

    return link
  })
}
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
          <p>{{ $t('about.examples.text') }}</p>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <!-- Latest lexicons/datasets -->
        <div>
          <h2>{{ $t('about.additions.title') }}</h2>
          <p>{{ $t('about.additions.text') }}</p>
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

  .additions {
    margin-top: 1rem;
  }

  .news {
  }
}
</style>
