/* tslint:disable: variable-name */
/* tslint:disable: match-default-export-name */
import bodyParser from "body-parser";
import cors from "cors";
import express, { Express } from "express";
/* tslint:enable: match-default-export-name */
import { Server } from "http";
import passport from "passport";
import { Connection, createConnection } from "typeorm";
import { constants } from "./constants";
import { Highlight, User } from "./entities";
import routes from "./routes";
import { testData } from "./__seed__/data";

export interface AlternativeConfig {
    database: string;
}

// Singleton class
export class App {
    private static _instance: App;
    public static get Instance(): App {
        return this._instance || (this._instance = new this());
    }

    private _app: Express;
    public get app(): Express { return this._app; }

    private _connection: Connection;
    public get connection(): Connection { return this._connection; }

    private _server: Server;
    public get server(): Server { return this._server; }

    private constructor() { }

    // createConnection method will automatically read connection options
    // from your ormconfig file or environment variables
    public async start(alternativeConfig?: AlternativeConfig): Promise<void> {
        try {
            this._connection = await createConnection({
                type: "sqlite",
                name: "default",
                database: alternativeConfig ? alternativeConfig.database : `${__dirname}/../dev.sqlite3`,
                entities: [
                    `${__dirname}/entities/**/*{.ts,.js}`,
                ],
                synchronize: true,
                dropSchema: true,
            });

            await this.establishNeededObjects();
        } catch (e) {
            Promise.reject(e);
        }
        this._app = express();
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(passport.initialize());

        this.app.use("/", routes);

        this._server = await this.app.listen(3000, () => console.log("Listen 3000"));
    }

    public async close(): Promise<void> {
        await this.server.close();
        await this.connection.close();
    }

    // This will drop the current db
    // Use with care
    public async dropClose(): Promise<void> {
        await this.server.close();
        await this.connection.dropDatabase();
        await this.connection.close();
    }

    public async establishNeededObjects(): Promise<void> {
        const deletedOwner = new User();
        deletedOwner.username = constants.DELETED_USER_USERNAME;
        deletedOwner.password = constants.DELETED_USER_PASSWORD;
        deletedOwner.email = constants.DELETED_USER_EMAIL;
        try {
            await deletedOwner.save();
        } catch {
            Promise.reject("Could not establish needed objects.");
        }
    }

    public async fromTestSeedStart(alternativeConfig?: AlternativeConfig): Promise<void> {
        await this.start(alternativeConfig);
        await this.dropClose();
        await this.start(alternativeConfig);
        await this.connection.getRepository(Highlight).save(testData);
    }

    public isValid(): boolean {
        return this.connection.isConnected;
    }
}
