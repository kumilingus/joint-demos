// Inter (the font of the app and of the texts of the diagram): bundled, its weights used in the diagram
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-400-italic.css';
import '@fontsource/inter/latin-600-italic.css';
import '@fontsource/inter/latin-700-italic.css';
import './styles.css';
import { setTheme } from '@joint/plus';
import { init } from './app';

// A theme of its own, styled from scratch in `theme/theme.css` (and the app in `styles.css`): none of the
// built-in theme styles apply to it.
setTheme('minimal');

// The texts of the diagram are measured when they are rendered (wrapped, cut with an ellipsis): in Inter, loaded first
Promise.all(['400', '600', '700'].map(weight => document.fonts.load(`${weight} 16px Inter`))).finally(init);
