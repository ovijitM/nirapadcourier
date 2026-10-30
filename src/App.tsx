import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './app/router.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
