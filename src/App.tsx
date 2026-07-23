import { AppRouter } from './app/router'
import { AuthBootstrap } from './app/AuthBootstrap'
import { AppSplashScreen } from './shared/components/AppSplashScreen'
import { PullToRefresh } from './shared/components/PullToRefresh'

function App() {
  return (
    <AuthBootstrap>
      <AppSplashScreen />
      <PullToRefresh />
      <AppRouter />
    </AuthBootstrap>
  )
}

export default App
