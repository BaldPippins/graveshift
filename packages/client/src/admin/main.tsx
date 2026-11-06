import { render } from 'preact';
import { AdminApp } from './AdminApp.tsx';
import '../styles.css';
import './admin.css';

const root = document.getElementById('admin');
if (root === null) {
  throw new Error('Missing admin root');
}
render(<AdminApp />, root);
