import { render } from 'preact';
import { EditorApp } from './EditorApp.tsx';
import '../styles.css';
import './editor.css';

const root = document.getElementById('editor');
if (root === null) {
  throw new Error('Missing editor root');
}
render(<EditorApp />, root);
