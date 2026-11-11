<template>
  <p class="loading" v-show="loading">Chargement...</p>
  <p class="error" v-if="error">{{ error }}</p>

  <div v-if="country">
    <img :src="country.flags.svg" :alt="`Drapeau ${country.name}`" style="width: 200px;" />
    <h1>{{ country.name }}</h1>
    <p>Nom natif : {{ country.nativeName || '—' }}</p>
    <p>Capitale : {{ country.capital || '—' }}</p>
    <p>Région : {{ country.region }}{{ country.subregion ? ' · ' + country.subregion : '' }}</p>
    <p>Population : {{ (country.population ?? 0).toLocaleString() }}</p>
  </div>

  <button @click="$router.back()">Retour</button>
</template>

<script>
const API_URL = 'https://countries.dev/countries'

export default {
  name: 'CountryDetailView',
  data() {
    return {
      country: null,
      loading: true,
      error: null
    }
  },
  methods: {
    // Même principe que CountryListView. La réponse peut être un objet ou
    // un tableau : on gère les deux cas avant d'affecter this.country.
    // L'API fournit la liste via /countries : on la charge ici, séparément,
    // puis on retient le pays dont alpha3Code correspond à :code.
    async chargerPays() {
      const code = String(this.$route.params.code).toUpperCase()
      this.loading = true
      this.error = null
      this.country = null
      try {
        const reponse = await fetch(API_URL)
        if (!reponse.ok) throw new Error(`Erreur ${reponse.status}`)
        const donnees = await reponse.json()
        const pays = Array.isArray(donnees)
          ? donnees.find(c => c.alpha3Code === code || c.alpha2Code === code)
          : donnees
        if (!pays) throw new Error('Pays introuvable')
        this.country = pays
      } catch (e) {
        this.error = 'Impossible de charger ce pays.'
      } finally {
        this.loading = false
      }
    }
  },
  watch: {
    // Bonus : Vue Router réutilise le composant quand seul :code change,
    // mounted ne se redéclenche pas -> on recharge via watch.
    '$route.params.code'(nouveauCode) {
      if (nouveauCode) this.chargerPays()
    }
  },
  mounted() {
    this.chargerPays()
  }
}
</script>
