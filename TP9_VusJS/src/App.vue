<!--
  TP9 -- Meteo en direct.
  Le gabarit (template) est deja cable sur les donnees : il n'y a rien a
  modifier dans la partie template. Tout le travail est dans les methodes
  et la computed de la partie script, marquees TODO 1 a 6.
-->
<template>
  <div class="app">
    <header class="topbar">
      <h1>Météo en direct</h1>
      <button class="unit-toggle" @click="basculerUnite" v-if="ville">
        Afficher en {{ unite === 'metric' ? '°F' : '°C' }}
      </button>
    </header>

    <div class="search">
      <input
        v-model="query"
        @input="onInputRecherche"
        type="text"
        placeholder="Rechercher une ville... (ex: Safi, Paris, Tokyo)"
      />
      <p class="hint" v-if="chargementSuggestions">Recherche...</p>
      <p class="msg-error" v-if="erreurSuggestions">{{ erreurSuggestions }}</p>

      <ul class="suggestions" v-if="suggestions.length">
        <li v-for="s in suggestions" :key="s.lat + '-' + s.lon" @click="choisirVille(s)">
          {{ s.name }}<span v-if="s.state">, {{ s.state }}</span> ({{ s.country }})
        </li>
      </ul>
    </div>

    <div class="historique" v-if="historique.length">
      <span>Récent :</span>
      <button v-for="h in historique" :key="h.lat + '-' + h.lon" @click="choisirVille(h)">
        {{ h.name }}
      </button>
    </div>

    <div class="meteo" v-if="ville">
      <p class="loading" v-if="chargementMeteo">Chargement de la météo...</p>
      <p class="msg-error" v-else-if="erreurMeteo">{{ erreurMeteo }}</p>

      <div v-else-if="meteoActuelle" class="courante">
        <h2>{{ ville.name }}, {{ ville.country }}</h2>
        <div class="temp-actuelle">
          <img :src="iconeUrl(meteoActuelle.weather[0].icon)" :alt="meteoActuelle.weather[0].description" />
          <span class="valeur">{{ Math.round(meteoActuelle.main.temp) }}°</span>
          <span class="description">{{ meteoActuelle.weather[0].description }}</span>
        </div>
        <p class="details">
          Ressenti {{ Math.round(meteoActuelle.main.feels_like) }}° · Humidité {{ meteoActuelle.main.humidity }}%
        </p>
      </div>

      <div class="previsions" v-if="previsionsParJour.length">
        <div class="jour" v-for="j in previsionsParJour" :key="j.date">
          <span class="date">{{ j.date }}</span>
          <img :src="iconeUrl(j.icone)" :alt="j.description" />
          <span class="temps">{{ Math.round(j.min) }}° / {{ Math.round(j.max) }}°</span>
        </div>
      </div>
    </div>

    <p class="empty" v-if="!ville">Cherchez une ville pour voir sa météo.</p>
  </div>
</template>

<script>
// La cle est lue depuis .env (jamais committee -- voir .env.example et le sujet).
const API_KEY = import.meta.env.VITE_OWM_API_KEY
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct'
const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast'

export default {
  name: 'App',
  data() {
    return {
      query: '',
      debounceTimer: null,
      suggestions: [],
      chargementSuggestions: false,
      erreurSuggestions: null,

      ville: null, // { name, country, state, lat, lon }
      historique: [],

      meteoActuelle: null,
      previsions: [], // tableau brut renvoye par /forecast (tranches de 3h)
      chargementMeteo: false,
      erreurMeteo: null,

      unite: 'metric' // 'metric' (°C) | 'imperial' (°F)
    }
  },
  computed: {
    // TODO 6 : regroupez this.previsions (tranches de 3h, sur 5 jours) en une
    // prevision par jour. Chaque element de this.previsions a la forme :
    //   { dt_txt: "2024-05-12 15:00:00", main: { temp_min, temp_max }, weather: [{ icon, description }] }
    // Indice : la partie de dt_txt avant l'espace ("2024-05-12") est une bonne
    // cle de regroupement. Pour chaque jour, calculez le min et le max des
    // temperatures rencontrees, et gardez une icone/description representative
    // (par exemple celle de la tranche la plus proche de midi).
    // Renvoyez un tableau trie par date : [{ date, min, max, icone, description }, ...]
    previsionsParJour() {
      const parJour = {}

      for (const tranche of this.previsions) {
        const cle = tranche.dt_txt.split(' ')[0] // "2024-05-12"
        const heure = parseInt(tranche.dt_txt.split(' ')[1], 10)
        const { temp_min, temp_max } = tranche.main
        const meteo = tranche.weather[0]

        if (!parJour[cle]) {
          parJour[cle] = {
            cle,
            min: temp_min,
            max: temp_max,
            icone: meteo.icon,
            description: meteo.description,
            ecartMidi: Math.abs(heure - 12)
          }
          continue
        }

        const jour = parJour[cle]
        jour.min = Math.min(jour.min, temp_min)
        jour.max = Math.max(jour.max, temp_max)
        // icône/description représentatives : tranche la plus proche de midi
        const ecart = Math.abs(heure - 12)
        if (ecart < jour.ecartMidi) {
          jour.ecartMidi = ecart
          jour.icone = meteo.icon
          jour.description = meteo.description
        }
      }

      // Les clés ISO (AAAA-MM-JJ) se trient correctement par ordre alphabétique
      return Object.values(parJour)
        .sort((x, y) => x.cle.localeCompare(y.cle))
        .map(j => {
          const [an, mois, jr] = j.cle.split('-').map(Number)
          const date = new Date(an, mois - 1, jr).toLocaleDateString('fr-FR', {
            weekday: 'short', day: 'numeric', month: 'short'
          })
          return { date, min: j.min, max: j.max, icone: j.icone, description: j.description }
        })
    }
  },
  methods: {
    iconeUrl(code) {
      return `https://openweathermap.org/img/wn/${code}@2x.png`
    },

    // TODO 1 : recherche différée (debounce de 400 ms).
    // clearTimeout en tout début de fonction : sinon chaque frappe laisserait
    // un minuteur actif et plusieurs requêtes partiraient.
    onInputRecherche() {
      clearTimeout(this.debounceTimer)

      if (!this.query.trim()) {
        this.suggestions = []
        this.erreurSuggestions = null
        this.chargementSuggestions = false
        return
      }

      this.debounceTimer = setTimeout(() => {
        this.rechercherVilles()
      }, 400)
    },

    // TODO 2 : géocodage. Trois cas d'erreur distincts :
    // 401 (clé invalide), 429 (quota dépassé) et tableau vide (ville introuvable,
    // qui n'est PAS une erreur HTTP : l'API répond 200 avec []).
    async rechercherVilles() {
      const requete = this.query.trim()
      if (!requete) return

      this.chargementSuggestions = true
      this.erreurSuggestions = null

      try {
        const url = `${GEO_URL}?q=${encodeURIComponent(requete)}&limit=5&appid=${API_KEY}`
        const reponse = await fetch(url)

        // Réponse périmée : l'utilisateur a déjà tapé autre chose entre-temps
        if (requete !== this.query.trim()) return

        if (reponse.status === 401) {
          this.suggestions = []
          this.erreurSuggestions = 'Clé API invalide ou absente. Vérifiez votre fichier .env.'
          return
        }
        if (reponse.status === 429) {
          this.suggestions = []
          this.erreurSuggestions = 'Quota d\'appels dépassé, réessayez plus tard.'
          return
        }
        if (!reponse.ok) throw new Error(`Erreur ${reponse.status}`)

        const villes = await reponse.json()
        if (requete !== this.query.trim()) return

        if (villes.length === 0) {
          this.suggestions = []
          this.erreurSuggestions = `Aucune ville trouvée pour « ${requete} ».`
          return
        }
        this.suggestions = villes
      } catch (e) {
        this.suggestions = []
        this.erreurSuggestions = 'Impossible de contacter le service météo. Vérifiez votre connexion.'
      } finally {
        if (requete === this.query.trim()) this.chargementSuggestions = false
      }
    },

    // TODO 3 : sélection d'une ville (suggestion ou historique).
    choisirVille(ville) {
      this.suggestions = []
      this.query = ''
      this.erreurSuggestions = null
      clearTimeout(this.debounceTimer)

      this.ville = {
        name: ville.name,
        country: ville.country,
        state: ville.state,
        lat: ville.lat,
        lon: ville.lon
      }

      // En tête de l'historique, sans doublon sur (lat, lon), 5 éléments max
      this.historique = [
        this.ville,
        ...this.historique.filter(h => !(h.lat === ville.lat && h.lon === ville.lon))
      ].slice(0, 5)
      this.sauvegarderHistorique()

      this.chargerMeteo()
    },

    // TODO 4 : météo actuelle + prévisions lancées en parallèle (Promise.all).
    async chargerMeteo() {
      if (!this.ville) return
      const { lat, lon } = this.ville
      const unite = this.unite

      this.chargementMeteo = true
      this.erreurMeteo = null

      try {
        const parametres = `lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unite}&lang=fr`
        const [repActuelle, repPrevisions] = await Promise.all([
          fetch(`${WEATHER_URL}?${parametres}`),
          fetch(`${FORECAST_URL}?${parametres}`)
        ])

        for (const rep of [repActuelle, repPrevisions]) {
          if (rep.status === 401) throw new Error('CLE')
          if (rep.status === 429) throw new Error('QUOTA')
          if (!rep.ok) throw new Error(`Erreur ${rep.status}`)
        }

        const [actuelle, previsions] = await Promise.all([
          repActuelle.json(),
          repPrevisions.json()
        ])

        // Réponse périmée (autre ville ou autre unité choisie entre-temps)
        if (!this.ville || this.ville.lat !== lat || this.ville.lon !== lon || this.unite !== unite) return

        this.meteoActuelle = actuelle
        this.previsions = previsions.list
      } catch (e) {
        if (!this.ville || this.ville.lat !== lat || this.ville.lon !== lon) return
        this.meteoActuelle = null
        this.previsions = []
        if (e.message === 'CLE') {
          this.erreurMeteo = 'Clé API invalide ou absente. Vérifiez votre fichier .env.'
        } else if (e.message === 'QUOTA') {
          this.erreurMeteo = 'Quota d\'appels dépassé, réessayez plus tard.'
        } else if (e instanceof TypeError) {
          this.erreurMeteo = 'Impossible de contacter le service météo. Vérifiez votre connexion.'
        } else {
          this.erreurMeteo = 'Impossible de charger la météo de cette ville.'
        }
      } finally {
        if (this.ville && this.ville.lat === lat && this.ville.lon === lon) {
          this.chargementMeteo = false
        }
      }
    },

    // TODO 5 : changer d'unité = refaire l'appel avec un autre paramètre units=.
    basculerUnite() {
      this.unite = this.unite === 'metric' ? 'imperial' : 'metric'
      this.chargerMeteo()
    },

    // ---- Bonus : historique persistant (localStorage) ----
    sauvegarderHistorique() {
      try {
        localStorage.setItem('tp9-historique', JSON.stringify(this.historique))
      } catch (e) { /* stockage indisponible : on ignore */ }
    },
    chargerHistorique() {
      try {
        const brut = localStorage.getItem('tp9-historique')
        const liste = brut ? JSON.parse(brut) : []
        this.historique = Array.isArray(liste) ? liste.slice(0, 5) : []
      } catch (e) {
        this.historique = []
      }
    },

    // ---- Bonus : météo de la position actuelle ----
    localiser() {
      if (!('geolocation' in navigator)) return
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (this.ville) return // l'utilisateur a déjà choisi une ville
          this.ville = {
            name: 'Ma position',
            country: '',
            lat: position.coords.latitude,
            lon: position.coords.longitude
          }
          await this.chargerMeteo()
          // L'API météo renvoie le nom de la ville et son pays
          if (this.meteoActuelle && this.ville && this.ville.name === 'Ma position') {
            this.ville = {
              ...this.ville,
              name: this.meteoActuelle.name || 'Ma position',
              country: (this.meteoActuelle.sys && this.meteoActuelle.sys.country) || ''
            }
          }
        },
        () => { /* refus ou erreur de géolocalisation : on ignore */ }
      )
    }
  },
  mounted() {
    this.chargerHistorique()
    this.localiser()
  },
  beforeUnmount() {
    clearTimeout(this.debounceTimer)
  }
}
</script>
