<script setup lang="ts">
// The first page of a new project (ui-start step 4): replace it with a recipe through ui-page.
// Goes to src/pages/Home/Home.vue.
import Page from '../../ui/Page/Page.vue'
import PageHeader from '../../ui/PageHeader/PageHeader.vue'
import { session } from '../../session'
</script>

<template>
  <Page data-page="home">
    <PageHeader title="Home" :subtitle="`Signed in as ${session.identity.value?.name ?? session.identity.value?.username ?? ''}`" />
  </Page>
</template>
