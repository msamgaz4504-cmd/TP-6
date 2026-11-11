import { reactive } from 'vue'

export const store = reactive({
  students: [
    { id: 1, nom: 'Dupont', prenom: 'Jean', filiere: 'Informatique', year: 2, email: 'jean.dupont@email.com' },
    { id: 2, nom: 'Martin', prenom: 'Sophie', filiere: 'Mathématiques', year: 1, email: 'sophie.martin@email.com' },
    { id: 3, nom: 'Bernard', prenom: 'Lucas', filiere: 'Informatique', year: 3, email: 'lucas.bernard@email.com' }
  ]
})