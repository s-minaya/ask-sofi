import { AppShell } from './app/AppShell'
import { SoundProvider } from './app/providers/SoundProvider'
import { ThemeProvider } from './app/providers/ThemeProvider'

function App() {
  return (
    <ThemeProvider>
      <SoundProvider>
        <AppShell />
      </SoundProvider>
    </ThemeProvider>
  )
}

export default App
