

for (let elem of document.getElementsByClassName("part_type")) {
    tippy(
        elem,
        {
            content: elem.getAttribute("title"),
            trigger: 'mouseenter focus',
          }
    )
}

tippy(
    "#copy_link",
    {
        content: "copy link",
    }
)
tippy(
    "#copy_link",
    {
        content: "copied link",
        trigger: 'click',
    }
)
tippy(
    "#save_to_book",
    {
        content: "save to scrapbook",
    }
)
tippy(
    "#save_to_book",
    {
        content: "saved to scrapbook",
        trigger: 'click',
      }
)

tippy(
    "#view_scrapbook",
    {
        content: "view scrapbook",
      }
)
tippy(
    "#reset",
    {
        content: "clear canvas",
      }
)
