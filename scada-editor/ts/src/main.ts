import './styles.css';
import { setTheme } from '@joint/plus';
import { init } from './app';

// A theme of its own, styled from scratch in `styles.css`: none of the
// built-in theme styles apply to it.
setTheme('scada');

init();
