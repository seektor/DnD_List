import './assets/styles/app.scss';
import { Body } from './viewport/Body/Body';
import { Header } from './viewport/Header/Header';

class App {

    constructor() {
        const header = new Header(document.body);
        const body = new Body(document.body);
    }
}

const app = new App();

export { app };

