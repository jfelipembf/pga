import user2 from "../../assets/images/users/user-2.jpg"
import user4 from "../../assets/images/users/user-4.jpg"
import user7 from "../../assets/images/users/user-7.jpg"
import user9 from "../../assets/images/users/user-9.jpg"

const kanban = [
    {
        id:1,
        name:"Todo",
        count:"(03)",
        cards:[
            {
                id:1,
                number:"DS-045",
                badgeText: "Testing",
                badgeColor: "success",
                title:"Dashboard UI",
                taskDetails:"Vitae turpis scelerisque scelerisque venenatis lorem quis enim congue aliquet.",
                comments:5,
                file:1,
                userImages:[{ id: 0, imageText: "E" }]
            },
            {
                id:2,
                number:"DS-046",
                badgeText: "Development",
                badgeColor: "info",
                title:"Calendar App Page",
                taskDetails:"Pellentesque aliquet eros viverra turpis tellus bibendum posuere orciconvallis est.",
                comments:41,
                file:21,
                userImages:[{ id: 0, imageText: "E" }, { id: 9, img: user9 }]
            },
            {
                id:3,
                number:"DS-047",
                badgeText: "Design",
                badgeColor: "danger",
                title:"Authentication Page Design",
                taskDetails:"Etiam orci aliquam feugiat velit aenean urna volutpat felis tincidunt ultricies.",
                comments:24,
                file:32,
                userImages:[{ id: 0, imageText: "A" }]
            }
        ]
    },
    {
        id:4,
        name: "In Progress",
        count:"(01)",
        cards:[
            {
                id:5,
                number:"DS-044",
                badgeText: "UX Design",
                badgeColor: "warning",
                title:"Components Pages",
                taskDetails:"Etiam orci aliquam feugiat velit aenean urna volutpat felis tincidunt ultricies.",
                comments:24,
                file:23,
                userImages:[{ id: 4, img: user4 }]
            }
        ]
    },
    {
        id:6,
        name: "On Hold",
        count:"(02)",
        cards:[
            {
                id:7,
                number:"DS-041",
                badgeText: "Design",
                badgeColor: "danger",
                title:"Admin layout Design",
                taskDetails:"Aenean congue lacus ultricies purus quis fend nunc eget efficitur rutrum.",
                comments:14,
                file:52,
                userImages:[{ id: 2, img: user2 },{ id: 0, imageText: "L" }]
            },
            {
                id:8,
                number:"DS-042",
                badgeText: "Graphic Design",
                badgeColor: "primary",
                title:"Brand Logo Design",
                taskDetails:"Etiam orci aliquam feugiat velit aenean urna volutpat felis tincidunt ultricies.",
                comments:24,
                file:23,
                userImages:[{ id: 7, img: user7 }, { id: 0, imageText: "B" }]
            },
        ]
    },
    {
        id:9,
        name: "Completed",
        count:"(03)",
        cards:[
            {
                id:11,
                number:"DS-041",
                badgeText: "Design",
                badgeColor: "info",
                title:"Admin Layout Design",
                taskDetails:"Pellentesque aliquet eros viverra turpis tellus bibendum posuere orcionvallis est.",
                comments:43,
                file:32,
                userImages:[{ id: 2, img: user2 }, { id: 0, imageText: "B" }]
            },
            {
                id:12,
                number:"DS-042",
                badgeText: "Testing",
                badgeColor: "success",
                title:"Brand Logo Design",
                taskDetails:"Etiam orci aliquam feugiat velit aenean urna volutpat felis tincidunt ultricies.",
                comments:12,
                file:32,
                userImages:[{ id: 0, imageText: "O" }]
            },
            {
                id:13,
                number:"DS-041",
                badgeText: "Design",
                badgeColor: "warning",
                title:"Admin Layout Design",
                taskDetails:"Etiam orci aliquam feugiat velit aenean urna volutpat felis tincidunt ultricies.",
                comments:5,
                file:43,
                userImages:[{ id: 0, imageText: "P" }]
            }
           
        ]
    }

]

export {kanban}