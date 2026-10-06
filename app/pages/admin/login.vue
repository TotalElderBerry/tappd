<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { fetch: refreshSession, loggedIn } = useUserSession()
if (loggedIn.value) await navigateTo('/admin')

const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await refreshSession()
    await navigateTo('/admin')
  } catch (e) {
    error.value = apiError(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="mx-auto mt-16 max-w-sm">
    <Card>
      <CardHeader><CardTitle>Sign in to Tappd admin</CardTitle></CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="submit">
          <div class="grid gap-2"><Label for="email">Email</Label><Input id="email" v-model="email" type="email" autocomplete="username" required /></div>
          <div class="grid gap-2"><Label for="password">Password</Label><Input id="password" v-model="password" type="password" autocomplete="current-password" required /></div>
          <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>
          <Button type="submit" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
