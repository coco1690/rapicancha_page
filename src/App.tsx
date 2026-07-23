import { AppRouter } from './app/router'
import { AuthBootstrap } from './app/AuthBootstrap'
import { AppSplashScreen } from './shared/components/AppSplashScreen'

function App() {
  return (
    <AuthBootstrap>
      <AppSplashScreen />
      <AppRouter />
    </AuthBootstrap>
  )
}

export default App
