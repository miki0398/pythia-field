import { Outlet } from 'react-router-dom'
import styles from '../../styles/global.module.css'

export default function AppLayout() {
  return (
    <div className={styles.app}>
      <Outlet />
    </div>
  )
}