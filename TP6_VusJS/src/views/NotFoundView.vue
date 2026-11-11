<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div>
    <h1>404 – Page introuvable</h1>
    <p>La page demandée n'existe pas.</p>
    <button @click="router.push('/')">← Retour à l'accueil</button>
  </div>
</template>