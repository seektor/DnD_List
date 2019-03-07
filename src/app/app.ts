import "./assets/styles/app.scss";
import { Toolbox } from "./components/Toolbox/Toolbox";
import { List } from "./components/List/List";

class App {

    constructor() {
        const toolbox = new Toolbox(document.getElementById("toolbox"));
        const list = new List(document.getElementById("list"));
        toolbox.setTargetListHandlers(list.getListHandlers());
    }
}

const app = new App();

export {
    app
}