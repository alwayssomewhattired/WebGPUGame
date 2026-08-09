import { createEntity } from "./Asset_Manager/fileParser.js";


export function initHTMLCallbacks(document) {

    // default browser behavior stopper

    window.addEventListener("dragover", (e) => {
        e.preventDefault();
    })

    window.addEventListener("drop", (e) => {
        e.preventDefault();
    })

    // game gui stuff

    const button = document.getElementById("model_button");

    const scrollContainer = document.getElementById("scroll_container");
    const scrollList = document.getElementById("scroll_list");

    scrollContainer.style.display = "none";
    scrollList.style.display = "none";

    button.addEventListener("click", () => {
        if (scrollContainer.style.display === 'none') {
            scrollContainer.style.display = "block";
            scrollList.style.display = "flex";
        } else {
            scrollContainer.style.display = "none";
            scrollList.style.display = "none";
        }
    });

    // dropzone

    const dropZone = document.getElementById("dropZone");

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", async (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");

        const files = e.dataTransfer.files;

        for (const file of files) {
            console.log(file.name);
            if (!file.name.endsWith("glb")) {
                console.log("file is not glb. not supported!");
                return;
            }

            const arrayBuffer = await file.arrayBuffer();

            createEntity(arrayBuffer, file.name);
        }
    })
}