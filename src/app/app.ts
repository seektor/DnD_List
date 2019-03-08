import "./assets/styles/app.scss";
import { Toolbox } from "./components/Toolbox/Toolbox";
import { List } from "./components/List/List";

class App {

    constructor() {
        const toolbox = new Toolbox(document.getElementById("toolbox"));
        const leftList = new List(document.getElementById("left-list"));
        const rightList = new List(document.getElementById("right-list"));

        toolbox.addTargetListHandlers(leftList.getListHandlers());
        toolbox.addTargetListHandlers(rightList.getListHandlers());
    }
}

const app = new App();

export {
    app
}