

export function initHTMLCallbacks(document) {
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
}