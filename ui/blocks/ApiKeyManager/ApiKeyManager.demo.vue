<script setup lang="ts">
import { calls, live } from '@/fake/api'
import ApiKeyManager from './ApiKeyManager.vue'
import type { ApiKeyScope } from './apiKeys'

const scopes: ApiKeyScope[] = [
  { value: 'customers:read', label: 'Read customers' },
  { value: 'customers:write', label: 'Change customers', description: 'Create, edit and delete customers.' },
  { value: 'orders:read', label: 'Read orders' },
]
</script>

<template>
  <section>
    <h2>Live list (New API key shows the secret once; Revoke asks first)</h2>
    <ApiKeyManager :target="live.apiKeys" :create="calls.createApiKey" :revoke="calls.revokeApiKey" :scopes="scopes" />
  </section>
</template>
