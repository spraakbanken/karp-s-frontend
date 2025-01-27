<script setup lang="ts">
import MenuBar from './MenuBar.vue'
</script>

<template>
  <div class="header-area">
    <div class="left-area">
      <div class="logo-box">
        <div v-if="$i18n.locale == 'sv'">
          <img
            class="logo"
            alt="Karp-S logo"
            src="@/assets/karps_slogan_sv_light_theme.svg"
            width="300"
          />
        </div>
        <div v-else>
          <img
            class="logo"
            alt="Karp-S logo"
            src="@/assets/karps_slogan_en_light_theme.svg"
            width="300"
          />
        </div>
      </div>
    </div>

    <div class="right-area">
      <div class="middle-area">
        <div class="sb-box">
          <a href="https://spraakbanken.gu.se/">
            <img src="@/assets/sprakbanken_text_light_theme.svg" alt="Språkbanken Text" />
          </a>
        </div>
        <div class="choices-area">
          <MenuBar />
        </div>
      </div>
      <div class="gu-box">
        <a href="https://gu.se/">
          <img src="@/assets/gu-sv.svg" alt="Göteborgs universitet" />
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (min-width: 1024px) {
  .header-area {
    display: flex;
    justify-content: space-between;
    padding-top: 1rem;
    padding-bottom: 1rem;
    padding-right: 2rem;
    padding-left: 2rem;
    margin-left: auto;
    margin-right: auto;
    background-color: white;
    box-sizing: border-box;
    width: 100%;
  }

  .header-area .left-area {
    display: flex;
    box-sizing: border-box;
  }

  .header-area .logo-box {
    box-sizing: border-box;
    margin-right: 1rem;
    vertical-align: bottom;
  }

  .header-area .right-area {
    display: flex;
    box-sizing: border-box;
  }

  .header-area .middle-area {
    display: flex;
    flex-direction: column;
    align-self: stretch;
    margin-right: 1rem;
    box-sizing: border-box;
  }

  .header-area .sb-box {
    display: flex;
    height: 3rem;
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 0%;
    justify-content: flex-end;
    text-align: right;
    box-sizing: border-box;
  }

  .header-area .choices-area {
    display: flex;
    flex-wrap: wrap;
    margin-top: 0.5rem;
    gap: 1rem;
    align-items: baseline;
  }

  .header-area .gu-box {
    height: 6rem;
    margin-top: -1rem;
    margin-bottom: -1rem;
    box-sizing: border-box;
  }

  .gu-box img {
    height: 100%;
    vertical-align: middle;
    box-sizing: border-box;
  }
}
</style>
