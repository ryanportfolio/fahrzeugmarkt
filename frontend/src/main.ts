import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { useThemeStore } from './stores/theme'
import './styles/tokens.css'
import './styles/base.css'

const app = createApp(App)
app.use(createPinia())

useThemeStore().apply()

app.use(router)
app.mount('#app')
