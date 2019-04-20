import "./assets/styles/app.scss";
import { Toolbox } from "./components/Toolbox/Toolbox";
import { List } from "./components/List/List";
import { smoothScroll } from "./utils/smooth-scroll/smoothScroll";
import { Header } from "./viewport/Header/Header";
import { Body } from "./viewport/Body/Body";

class App {

    constructor() {
        const header = new Header(document.body);
        const body = new Body(document.body);
        // const container = new Container().getContainerElement();
        // document.body.append(container);
        // const toolbox = new Toolbox(document.getElementById("toolbox"));
        // const leftList = new List(document.getElementById("left-list"));
        // const rightList = new List(document.getElementById("right-list"));

        // toolbox.addTargetListHandlers(leftList.getListHandlers());
        // toolbox.addTargetListHandlers(rightList.getListHandlers());
    }
}

const app = new App();

export {
    app
}