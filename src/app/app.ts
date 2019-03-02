import "./assets/styles/app.scss";
import { Toolbox } from "./components/Toolbox/Toolbox";
import { List } from "./components/List/List";

class App {

    constructor() {
        new Toolbox(document.getElementById("toolbox"));
        new List(document.getElementById("list"));
    }
}

const app = new App();

export {
    app
}