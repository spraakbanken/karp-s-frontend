<script setup lang="ts">
//import logoSB from '@/assets/sprakbanken_text_dark_theme.svg'
</script>

<template>
  <div class="footer-area">
    <div>
      <!--
      <a href="https://spraakbanken.gu.se"><img :src="logoSB" alt="Språkbanken Text logo" /></a>
      -->
    </div>
    <div>
      <p>
        <strong>{{ $t('footer.otherdata.title') }}</strong>
        {{ ' ' }}
        <i18n-t keypath="footer.about" scope="global">
          <a href="https://spraakbanken.gu.se/en/resources" :title="$t('footer.about.sbdata.title')"
            >Data</a
          >
          <a href="https://vlo.clarin.eu/" title="CLARIN Virtual Language Observatory"
            >Virtual Language Observatory</a
          >
        </i18n-t>
      </p>
      <div class="contact">
        {{ $t('footer.help') }}: <a href="mailto:sb-info@svenska.gu.se">sb-info@svenska.gu.se</a>
      </div>
    </div>
    <div>
      <p></p>
    </div>
  </div>
</template>

<style scoped>
@media (min-width: 1024px) {
  .footer-area {
    color: white;
    display: flex;
    justify-content: space-between;
    padding-top: 1rem;
    padding-bottom: 1rem;
    padding-right: 2rem;
    padding-left: 2rem;
    margin-left: auto;
    margin-right: auto;
    background-color: black;
    box-sizing: border-box;
    width: 100%;
  }

  .footer-area > div {
    color: white;
    flex: 1;
    padding: 2rem;
    box-sizing: border-box;
  }
}

.footer-area a {
  color: white;
  text-decoration: underline;
}

.footer-area .contact {
  color: var(--sb-orange);
  margin-top: 1rem;
  text-align: center;
}
</style>
