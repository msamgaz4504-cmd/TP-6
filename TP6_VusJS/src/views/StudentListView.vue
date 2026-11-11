<script setup>
import { ref, computed } from 'vue'
import { store } from '../store'
import StudentCard from '../components/StudentCard.vue'

// --- Formulaire d'ajout ---
const nouveauNom = ref('')
const nouveauPrenom = ref('')
const nouvelleFiliere = ref('')
const nouvelleAnnee = ref('')
const nouvelEmail = ref('')

// --- Barre d'outils ---
const recherche = ref('')
const tri = ref('nom') // 'nom' | 'filiere'

function ajouterEtudiant() {
  // Validation avant ajout
  if (
    !nouveauNom.value.trim() ||
    !nouveauPrenom.value.trim() ||
    !nouvelleFiliere.value.trim() ||
    !nouvelleAnnee.value ||
    !nouvelEmail.value.trim()
  ) {
    return
  }

  store.students.push({
    id: Date.now(), // id numérique unique
    nom: nouveauNom.value.trim(),
    prenom: nouveauPrenom.value.trim(),
    filiere: nouvelleFiliere.value.trim(),
    year: Number(nouvelleAnnee.value),
    email: nouvelEmail.value.trim()
  })

  // Réinitialisation du formulaire
  nouveauNom.value = ''
  nouveauPrenom.value = ''
  nouvelleFiliere.value = ''
  nouvelleAnnee.value = ''
  nouvelEmail.value = ''
}

// --- Propriété calculée : filtrer PUIS trier ---
const etudiantsAffiches = computed(() => {
  const q = recherche.value.trim().toLowerCase()

  const filtres = store.students.filter((e) => {
    if (!q) return true
    return (
      e.nom.toLowerCase().includes(q) ||
      e.prenom.toLowerCase().includes(q)
    )
  })

  // On trie une copie pour ne pas muter le store
  return [...filtres].sort((a, b) => {
    if (tri.value === 'filiere') {
      return a.filiere.localeCompare(b.filiere)
    }
    return a.nom.localeCompare(b.nom)
  })
})
</script>

<template>
  <div>
    <h1>Annuaire des étudiants</h1>

    <!-- Formulaire d'ajout -->
    <form @submit.prevent="ajouterEtudiant">
      <input v-model="nouveauNom" placeholder="Nom" />
      <input v-model="nouveauPrenom" placeholder="Prénom" />
      <input v-model="nouvelleFiliere" placeholder="Filière" />
      <input v-model.number="nouvelleAnnee" type="number" placeholder="Année" />
      <input v-model="nouvelEmail" type="email" placeholder="Email" />
      <button type="submit">Ajouter</button>
    </form>

    <!-- Barre d'outils -->
    <div>
      <input v-model="recherche" placeholder="Rechercher par nom ou prénom…" />
      <select v-model="tri">
        <option value="nom">Trier par nom</option>
        <option value="filiere">Trier par filière</option>
      </select>
    </div>

    <!-- Liste des cartes -->
    <div>
      <StudentCard
        v-for="etudiant in etudiantsAffiches"
        :key="etudiant.id"
        :student="etudiant"
      />
    </div>
  </div>
</template>