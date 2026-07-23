import { AppRouter } from './app/router'
import { AuthBootstrap } from './app/AuthBootstrap'

function App() {
  return (
    <AuthBootstrap>
      <AppRouter />
    </AuthBootstrap>
  )
}

export default App
