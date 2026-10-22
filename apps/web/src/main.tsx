import { createRoot } from 'react-dom/client';

import { Startup } from './ui/startup/Startup';
import './ui/styles.css';

const root = document.getElementById('root');

if (!root) {
    throw new Error('Application root is missing');
}

createRoot(root).render(<Startup />);
