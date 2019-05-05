import supertest from "supertest";
import { App } from "../app";
import { Group } from "../entities";
import { PrivateUserInfo } from "../entities/User";

// Tests currently rely on the dev db
describe("Test routes", () => {
    let app: App;
    beforeAll(async (done) => {
        app = App.Instance;
        // NOTE: This is constructs a local .sqlite db with seed data from __seed__ folder
        await app.fromTestSeedStart({
            database: "./test.sqlite3",
        });

        done();
    });

    afterAll(async (done) => {
        await app.dropClose();

        done();
    });

    // Testing variables
    const username = "testuser";
    const email = "testuser@sharklasers.com";
    const password = "password";

    describe("Users routing", () => {
        describe("Create should work only with valid params", () => {
            it("Should fail giving given incorrect input", async (done) => {
                const response = await supertest(app.app)
                    .post("/users/signup")
                    .send({ // No username provided
                        email,
                        password,
                    });
                expect(response.status).toBe(400);

                done();
            });

            it("Should create user on valid info", async (done) => {
                const response = await supertest(app.app)
                    .post("/users/signup")
                    .send({
                        username,
                        email,
                        password,
                    });
                expect(response.status).toBe(201);
                expect(response.body).toMatchObject({
                    newUser: {
                        username,
                        email,
                    },
                });

                done();
            });
        });

        describe("Login should work only user credentials", () => {
            it("Should fail login with incorrect user credentials", async (done) => {
                const response = await supertest(app.app)
                    .post("/users/login")
                    .send({ // Incorrect password
                        username,
                        password: "blah",
                    });
                expect(response.status).toBe(401);

                done();
            });

            it("Should login user given correct credentials", async (done) => {
                const response = await supertest(app.app)
                    .post("/users/login")
                    .send({
                        username,
                        password,
                    });
                expect(response.status).toBe(200);
                expect(response.body).toMatchObject({
                    user: {
                        username,
                        email,
                    },
                });

                done();
            });
        });

        describe("Delete should work user and auth", () => {
            it("Should fail without auth", async (done) => {
                const response = await supertest(app.app)
                    .delete("/users");
                expect(response.status).toBe(401);

                done();
            });

            it("Should delete user with auth", async (done) => {
                let response = await supertest(app.app)
                    .post("/users/signup")
                    .send({
                        username: "jim",
                        email: "jim@jim.com",
                        password: "jim is cool",
                    });
                response = await supertest(app.app)
                    .delete("/users")
                    .auth(response.body.newUser.token, { type: "bearer" });
                expect(response.status).toBe(200);

                done();
            });
        });
    });

    describe("Groups routing", () => {
        let loggedInUser: PrivateUserInfo;
        let testGroup: Group;

        beforeAll(async () => {
            const tempGroup = new Group();
            testGroup = await tempGroup.save();
            const response = await supertest(app.app)
                .post("/users/login")
                .send({
                    username,
                    password,
                });

            loggedInUser = response.body.user;
        });

        describe("Creation for group should require valid args", () => {
            it("Should fail without a valid user", async (done) => {
                const response = await supertest(app.app)   // No auth provided
                    .post("/groups/create")
                    .send();
                expect(response.status).toBe(401);

                done();
            });

            it("Should work with valid user", async (done) => {
                let response = await supertest(app.app)
                    .post("/groups/create")
                    .auth(loggedInUser.token, { type: "bearer" })
                    .send();
                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty("created");

                const groupCreated = response.body.created;
                response = await supertest(app.app)
                    .post("/users/login")
                    .send({
                        username,
                        password,
                    });
                expect(response.body.user.groups).toEqual([groupCreated]);

                done();
            });
        });

        describe("Join group should allow valid auth user to join group with valid given name", () => {
            it("Should fail without a valid user or group name", async (done) => {
                let response = await supertest(app.app) // No auth
                    .post("/groups/join")
                    .send({
                        groupName: testGroup.groupName,
                    });
                expect(response.status).toBe(401);

                response = await supertest(app.app) // Not a valid group name
                    .post("/groups/join")
                    .auth(loggedInUser.token, { type: "bearer" })
                    .send({
                        groupName: "this-doesn't-exist",
                    });
                expect(response.status).toBe(400);
                expect(response.body).toEqual({ error: "Group with name \"this-doesn't-exist\" does not exist." });

                done();
            });

            it("Should work with valid user and group name", async (done) => {
                let response = await supertest(app.app)
                    .post("/groups/join")
                    .auth(loggedInUser.token, { type: "bearer" })
                    .send({
                        groupName: testGroup.groupName,
                    });
                expect(response.status).toBe(200);

                response = await supertest(app.app)
                    .post("/users/login")
                    .send({
                        username,
                        password,
                    });
                expect(response.body.user.groups).toContainEqual({ name: testGroup.groupName });

                done();
            });
        });

        describe("Leave group should allow valid auth user to leave a group they belong to", () => {
            it("Should fail without a valid user or group name", async (done) => {
                let response = await supertest(app.app)
                    .post("/groups/leave")
                    .send({
                        groupName: testGroup.groupName,
                    });
                expect(response.status).toBe(401);

                response = await supertest(app.app)
                    .post("/groups/leave")
                    .auth(loggedInUser.token, { type: "bearer" })
                    .send({
                        groupName: "this-doesn't-exist",
                    });
                expect(response.status).toBe(400);
                expect(response.body).toEqual({ error: "User does not belong to a group named \"this-doesn't-exist.\"" });

                done();
            });

            it("Should work with valid user and group name", async (done) => {
                let response = await supertest(app.app)
                    .post("/groups/join")
                    .auth(loggedInUser.token, { type: "bearer" })
                    .send({
                        groupName: testGroup.groupName,
                    });

                response = await supertest(app.app)
                    .post("/groups/leave")
                    .auth(loggedInUser.token, { type: "bearer" })
                    .send({
                        groupName: testGroup.groupName,
                    });
                expect(response.status).toBe(200);

                response = await supertest(app.app)
                    .post("/users/login")
                    .send({
                        username,
                        password,
                    });
                expect(response.body.user.groups).not.toContainEqual({ name: testGroup.groupName });

                done();
            });
        });
    });

    describe("Comments routing", () => {
        let loggedInUser: PrivateUserInfo;

        beforeAll(async () => {
            const response = await supertest(app.app)
                .post("/users/login")
                .send({
                    username,
                    password,
                });

            loggedInUser = response.body.user;
        });

        describe("Index should work only with valid params", () => {
            it("Should fail giving comments for highlights on improper args", async (done) => {
                let response = await supertest(app.app).get("/highlights//");
                expect(response.status).toBe(400);

                response = await supertest(app.app).get("/highlights/1000");
                expect(response.status).toBe(400);
                expect(response.body).toEqual({ error: "Highlight 1000 does not exist" });

                done();
            });

            it("Should return initial comments for highlight ID", async (done) => {
                const response = await supertest(app.app).get("/highlights/1");
                expect(response.status).toBe(200);
                expect(response.body).toMatchObject({
                    topLevelComments: [
                        {
                            id: 1,
                            text: "This is a test comment",
                            likes: 0,
                            author: {
                                username: "joshhein",
                            },
                            responseComments: [
                                {
                                    id: 1,
                                    text: "This is a test response",
                                    likes: 0,
                                    author: {
                                        username: "Tom Brady",
                                    },
                                },
                            ],
                        },
                    ],
                });

                done();
            });
        });

        describe("Create should work only with valid params", () => {
            it("Should fail creation on invalid params", async (done) => {
                let response = await supertest(app.app)
                    .post("/comments")
                    .auth(loggedInUser.token, { type: "bearer" })
                    .send({});
                expect(response.status).toBe(400);
                expect(response.body).toEqual({ error: "Invalid query arguments. Either comment, ID not provided or both topLevelCommentID and highlightID given." });

                response = await supertest(app.app)
                    .post("/comments")
                    .auth(loggedInUser.token, { type: "bearer" })
                    .send({
                        topLevelCommentID: 1,
                        highlightID: 1,
                        comment: "This is testing element",
                    });
                expect(response.status).toBe(400);
                expect(response.body)
                    .toEqual({ error: "Invalid query arguments. Either comment, ID not provided or both topLevelCommentID and highlightID given." });    // Both highlight and parentID provided

                response = await supertest(app.app)
                    .post("/comments")
                    .auth(loggedInUser.token, { type: "bearer" })
                    .send({
                        topLevelCommentID: 10,
                        comment: "This is testing element",
                    });
                expect(response.status).toBe(400);
                expect(response.body)
                    .toEqual({ error: "Parent comment does not exist with ID 10." });

                response = await supertest(app.app)
                    .post("/comments")
                    .auth("fake-jwt", { type: "bearer" })
                    .send({
                        topLevelCommentID: 1,
                        comment: "This is testing element",
                    });
                expect(response.status).toBe(401);

                response = await supertest(app.app)
                    .post("/comments")
                    .auth(loggedInUser.token, { type: "bearer" })
                    .send({
                        highlightID: 10,
                        comment: "This is testing element",
                    });
                expect(response.status).toBe(400);
                expect(response.body)
                    .toEqual({ error: "Highlight does not exist with ID 10." });

                done();
            });

            it("Should create and return new comment on valid params", async (done) => {
                let response = await supertest(app.app)
                    .post("/comments")
                    .auth(loggedInUser.token, { type: "bearer" })
                    .send({
                        topLevelCommentID: 1,
                        comment: "This is a testing element",
                        shoutOuts: ["test"],    // Usernames of those to be shouted out
                    });
                expect(response.status).toBe(201);
                expect(response.body)
                    .toMatchObject({
                        newComment: {
                            author: {
                                username,
                            },
                            topLevelComment: {
                                highlight: { text: "Health said at least 30 people statewide" },
                            },
                            text: "This is a testing element",
                        },
                    });

                response = await supertest(app.app)
                    .post("/comments")
                    .auth(loggedInUser.token, { type: "bearer" })
                    .send({
                        highlightID: 1,
                        comment: "This is testing element",
                    });

                expect(response.status).toBe(201);
                expect(response.body)
                    .toMatchObject({
                        newComment: {
                            author: {
                                username,
                            },
                            highlight: {
                                id: 1,
                            },
                            text: "This is testing element",
                        },
                    });
                const id = response.body.newComment.id;

                response = await supertest(app.app)
                    .post("/users/signup")
                    .send({
                        username: "bo",
                        email: "faklsdjf@g.com",
                        password: "fkadjfla93202",
                    });

                response = await supertest(app.app)
                    .post(`/comments/like/${id}`)
                    .auth(response.body.newUser.token, { type: "bearer" });
                expect(response.status).toBe(200);

                done();
            });
        });
    });

    describe("Highlights routing", () => {
        let loggedInUser: PrivateUserInfo;

        beforeAll(async () => {
            const response = await supertest(app.app)
                .post("/users/login")
                .send({
                    username,
                    password,
                });

            loggedInUser = response.body.user;
        });

        describe("Show should work only with valid params", () => {
            it("Should fail giving highlights on misformed url", async (done) => {
                let response = await supertest(app.app).get("/highlights");
                expect(response.status).toBe(400);
                expect(response.body)
                    .toEqual({ error: "Failure in format of ?url=." });

                response = await supertest(app.app).get("/highlights?url=https://www.notreal.com/fhsk?fjd=1");
                expect(response.status).toBe(400);
                expect(response.body)
                    .toEqual({ error: "Failure in format of ?url=." });

                response = await supertest(app.app).get("/highlights?url=https://www.notreal.com/fhsk");
                expect(response.status).toBe(400);
                expect(response.body)
                    .toEqual({ error: `https://www.notreal.com/fhsk not found.` });

                done();
            });

            it("Should provide highlights for valid url", async (done) => {
                const response = await supertest(app.app)
                    .get("/highlights?url=https://www.nytimes.com/2019/01/31/us/weather-polar-vortex.html");
                expect(response.status).toBe(200);
                expect(response.body.highlights)
                    .toMatchObject([
                        {
                            "id": 1,
                            "index": 0,
                            "text": "Health said at least 30 people statewide",
                        },
                    ]);

                done();
            });
        });

        describe("Create should work only with valid params", () => {
            it("Should fail on creation with invalid args and get params in URL", async (done) => {
                let response = await supertest(app.app)
                    .post("/highlights")
                    .auth(loggedInUser.token, { type: "bearer" })
                    .send({
                        url: "https://www.notreal.com/fhsk?",
                        text: undefined,
                        index: -1,
                        comment: "Test initial comment",
                    });
                expect(response.status).toBe(400);
                expect(response.body)
                    .toEqual({ error: "Invalid query arguments." });

                response = await supertest(app.app)
                    .post("/highlights")
                    .auth(loggedInUser.token, { type: "bearer" })
                    .send({
                        url: "https://www.notreal.com/fhsk?fjd=1",
                        text: "Test text",
                        index: 0,
                        comment: "Test initial comment",
                    });
                expect(response.status).toBe(400);
                expect(response.body)
                    .toEqual({ error: "URL argument contains get parameters." });

                done();
            });

            it("Should create with valid arguments and return the new highlight object", async (done) => {
                let response = await supertest(app.app)
                    .post("/highlights")
                    .auth(loggedInUser.token, { type: "bearer" })
                    .send({
                        url: "https://www.notreal.com/fhsk",
                        text: "Test text",
                        beforeText: "This is a context elem",   // Conext elems are optional but useful
                        afterText: "So is this.",
                        index: 0,
                        comment: "Test initial comment",
                    });
                expect(response.status).toBe(201);
                expect(response.body.newHighlight)
                    .toMatchObject({
                        text: "Test text",
                        index: 0,
                        topLevelComments: [{
                            "text": "Test initial comment",
                        }],
                        site: { url: "https://www.notreal.com/fhsk" },
                    });
                response = await supertest(app.app)
                    .post("/highlights")
                    .auth(loggedInUser.token, { type: "bearer" })
                    .send({
                        url: "https://www.notreal.com/fhsk",
                        text: "Test text",
                        beforeText: "This is a context elem2",   // Conext elems are optional but useful
                        afterText: "So is this2.",
                        index: 1,
                    });
                response = await supertest(app.app)
                    .get("/highlights?url=https://www.notreal.com/fhsk");
                expect(response.body).toMatchObject({
                    highlights: [
                        {
                            id: 2,
                            text: "Test text",
                            beforeText: "This is a context elem",
                            afterText: "So is this.",
                            index: 0,
                            author: {
                                username: "testuser",
                            },
                            topLevelComments: [
                                {
                                    id: 3,
                                    text: "Test initial comment",
                                    likes: 0,
                                    responseComments: [],
                                },
                            ],
                        },
                        {
                            id: 3,
                            text: "Test text",
                            beforeText: "This is a context elem2",
                            afterText: "So is this2.",
                            index: 1,
                            author: {
                                username: "testuser",
                            },
                            topLevelComments: [],
                        },
                    ],
                });

                response = await supertest(app.app)
                    .post("/highlights")
                    .auth(loggedInUser.token, { type: "bearer" })
                    .send({
                        url: "https://www.nytimes.com/2019/01/31/us/weather-polar-vortex.html",
                        text: "Health said at least 30 people statewide",
                        index: 0,
                    });

                done();
            });
        });
    });
});
