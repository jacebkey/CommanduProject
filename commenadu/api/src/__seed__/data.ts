import { DeepPartial } from "typeorm";
import { Highlight } from "../entities";

export const testData: DeepPartial<Highlight> = {
    text: "Health said at least 30 people statewide",
    site: {
        url: "https://www.nytimes.com/2019/01/31/us/weather-polar-vortex.html",
    },
    author: {
        username: "gregnoonan",
        email: "gregnoonan@sharklasers.com",
        password: "78D@3iC#&gIBfNYr",
        id: 1,
    },
    topLevelComments: [
        {
            author: {
                username: "joshhein",
                email: "joshhein@sharklasers.com",
                password: "78D@3iC#&gIBfNYr",
            },
            text: "This is a test comment",
            responseComments: [
                {
                    author: {
                        username: "Tom Brady",
                        email: "tombrady@sharklasers.com",
                        password: "78D@3iC#&gIBfNYr",
                    },
                    text: "This is a test response",
                },
            ],
        },
    ],
};
