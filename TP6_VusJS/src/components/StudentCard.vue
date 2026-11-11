<script setup>
defineProps({
  student: Object
})
</script>

<template>
  <div class="card">
    <h3>{{ student.prenom }} {{ student.nom }}</h3>
    <p>Filière : {{ student.filiere }}</p>
    <router-link :to="`/etudiant/${student.id}`">Voir la fiche</router-link>
  </div>
</template>

<style scoped>
.card {
  border: 1px solid #ccc;
  padding: 10px;
  margin: 10px 0;
  border-radius: 5px;
}
</style>