<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { store } from '../store'

const route = useRoute()
const router = useRouter()

// Piège classique : route.params.id est une chaîne → Number(...)
const student = computed(() => {
  const id = Number(route.params.id)
  return store.students.find((e) => e.id === id)
})

function retour() {
  router.push({ name: 'students' })
}
</script>

<template>
  <div>
    <div v-if="student">
      <h1>{{ student.prenom }} {{ student.nom }}</h1>

      <!-- Champs éditables liés DIRECTEMENT sur la référence du store -->
      <p>
        Filière :
        <input v-model="student.filiere" />
      </p>
      <p>
        Année :
        <input v-model.number="student.year" type="number" />
      </p>
      <p>
        Email :
        <input v-model="student.email" type="email" />
      </p>

      <button @click="retour">← Retour à la liste</button>
    </div>

    <div v-else>
      <p>Étudiant introuvable.</p>
      <button @click="retour">← Retour à la liste</button>
    </div>
  </div>
</template>